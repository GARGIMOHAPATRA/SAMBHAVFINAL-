package com.accessibleconnect.backend.auth.service;

import com.accessibleconnect.backend.auth.entity.RefreshToken;
import com.accessibleconnect.backend.auth.repository.RefreshTokenRepository;
import com.accessibleconnect.backend.profile.entity.AccessibilityNeedType;
import com.accessibleconnect.backend.profile.entity.AccessibilityProfile;
import com.accessibleconnect.backend.profile.entity.ProfileAccessibilityNeed;
import com.accessibleconnect.backend.profile.repository.AccessibilityProfileRepository;
import com.accessibleconnect.backend.profile.repository.ProfileAccessibilityNeedRepository;
import com.accessibleconnect.backend.user.entity.AccountType;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessibilityProfileRepository profileRepository;

    @Autowired
    private ProfileAccessibilityNeedRepository needRepository;

    @Autowired
    private RefreshTokenRepository tokenRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Brute-force protection tracking maps (in-memory throttling)
    private final Map<String, Integer> loginFailures = new HashMap<>();
    private final Map<String, LocalDateTime> cooldownMap = new HashMap<>();

    @Transactional
    public User register(
            String name,
            String email,
            String password,
            String phone,
            AccountType accountType,
            List<AccessibilityNeedType> needs,
            String language,
            String signLanguage,
            String textSize,
            boolean highContrast,
            String commPreference) {

        if (userRepository.existsByEmail(email)) {
            throw new org.springframework.dao.DataIntegrityViolationException("Email already exists");
        }

        // Create User
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setAccountType(accountType);
        user.setEnabled(true);
        User savedUser = userRepository.save(user);

        // Create Profile if Accessibility User
        if (accountType == AccountType.ACCESSIBILITY_USER) {
            AccessibilityProfile profile = new AccessibilityProfile();
            profile.setUser(savedUser);
            profile.setPreferredLanguage(language);
            profile.setPreferredSignLanguage(signLanguage);
            profile.setTextSizePreference(textSize);
            profile.setHighContrastPreference(highContrast);
            profile.setCommunicationPreference(commPreference);

            if (needs != null && !needs.isEmpty()) {
                // Validate contradictory combinations (e.g. DEAF + HARD_OF_HEARING or BLIND + LOW_VISION)
                boolean hasDeaf = needs.contains(AccessibilityNeedType.DEAF);
                boolean hasHoH = needs.contains(AccessibilityNeedType.HARD_OF_HEARING);
                boolean hasBlind = needs.contains(AccessibilityNeedType.BLIND);
                boolean hasLowVision = needs.contains(AccessibilityNeedType.LOW_VISION);
                
                if (hasDeaf && hasHoH) {
                    throw new IllegalArgumentException("Cannot select both Deaf and Hard of Hearing simultaneously.");
                }
                if (hasBlind && hasLowVision) {
                    throw new IllegalArgumentException("Cannot select both Blind and Low Vision simultaneously.");
                }

                List<ProfileAccessibilityNeed> needList = new ArrayList<>();
                for (AccessibilityNeedType need : needs) {
                    // Validation: Do not allow MULTIPLE_NEEDS as a selectable need
                    if (need == AccessibilityNeedType.MULTIPLE_NEEDS) {
                        throw new IllegalArgumentException("MULTIPLE_NEEDS is not a selectable accessibility need");
                    }
                    needList.add(new ProfileAccessibilityNeed(profile, need));
                }
                profile.setNeeds(needList);
            }
            profileRepository.save(profile);
        }

        return savedUser;
    }

    public String login(String email, String password, HttpServletResponse response) {
        checkThrottling(email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPasswordHash())) {
            trackFailedAttempt(email);
            throw new BadCredentialsException("Invalid email or password.");
        }

        User user = userOpt.get();
        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account is suspended.");
        }

        // Reset brute-force failures
        loginFailures.remove(email);

        // Generate Access Token
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getAccountType().name(), user.getId());

        // Generate Refresh Token
        String refreshTokenString = jwtService.generateRefreshTokenString();
        String tokenHash = jwtService.hashToken(refreshTokenString);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setFamilyId(UUID.randomUUID());
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        tokenRepository.save(refreshToken);

        // Set HttpOnly secure rotated cookie
        setRefreshTokenCookie(response, refreshTokenString, 7 * 24 * 60 * 60);

        return accessToken;
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public String refresh(HttpServletRequest request, HttpServletResponse response) {
        String tokenValue = extractRefreshTokenFromCookie(request);
        if (tokenValue == null) {
            throw new BadCredentialsException("No refresh token found.");
        }

        String inputHash = jwtService.hashToken(tokenValue);
        Optional<RefreshToken> tokenOpt = tokenRepository.findByTokenHash(inputHash);

        if (tokenOpt.isEmpty()) {
            throw new BadCredentialsException("Invalid session.");
        }

        RefreshToken oldToken = tokenOpt.get();
        UUID familyId = oldToken.getFamilyId();

        // 1. Refresh Token Replay / Theft Detection
        if (oldToken.isRevoked()) {
            // Revoke the entire family tree of tokens immediately
            tokenRepository.revokeFamily(familyId);
            setRefreshTokenCookie(response, "", 0); // clear cookie
            throw new BadCredentialsException("Session compromised. Please log in again.");
        }

        if (oldToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Session expired.");
        }

        // 2. Rotate Refresh Token
        oldToken.setRevoked(true);
        tokenRepository.save(oldToken);

        String newRefreshTokenString = jwtService.generateRefreshTokenString();
        String newHash = jwtService.hashToken(newRefreshTokenString);

        RefreshToken newToken = new RefreshToken();
        newToken.setUser(oldToken.getUser());
        newToken.setTokenHash(newHash);
        newToken.setFamilyId(familyId); // keep same family tree
        newToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        tokenRepository.save(newToken);

        // Update cookie
        setRefreshTokenCookie(response, newRefreshTokenString, 7 * 24 * 60 * 60);

        // Return new Access Token
        return jwtService.generateAccessToken(
                oldToken.getUser().getEmail(), 
                oldToken.getUser().getAccountType().name(), 
                oldToken.getUser().getId()
        );
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String tokenValue = extractRefreshTokenFromCookie(request);
        if (tokenValue != null) {
            String inputHash = jwtService.hashToken(tokenValue);
            Optional<RefreshToken> tokenOpt = tokenRepository.findByTokenHash(inputHash);
            if (tokenOpt.isPresent()) {
                RefreshToken token = tokenOpt.get();
                // Revoke token family on logout
                tokenRepository.revokeFamily(token.getFamilyId());
            }
        }
        // Always clear the client cookie
        setRefreshTokenCookie(response, "", 0);
    }

    // Helper to set Cookie details
    private void setRefreshTokenCookie(HttpServletResponse response, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(true) // require HTTPS
                .sameSite("Strict") // CSRF mitigation
                .path("/api/auth") // only sent to auth controllers
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // Helper to extract Refresh Token from request cookies
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    // Throttling logic (Progressive delays)
    private void checkThrottling(String email) {
        if (cooldownMap.containsKey(email)) {
            if (cooldownMap.get(email).isAfter(LocalDateTime.now())) {
                throw new BadCredentialsException("Too many failed attempts. Try again later.");
            } else {
                cooldownMap.remove(email);
                loginFailures.remove(email);
            }
        }
    }

    private void trackFailedAttempt(String email) {
        int attempts = loginFailures.getOrDefault(email, 0) + 1;
        loginFailures.put(email, attempts);
        if (attempts >= 5) {
            cooldownMap.put(email, LocalDateTime.now().plusMinutes(5));
        }
    }

    // Password Reset OTP Store
    private static class OtpEntry {
        final String otp;
        final LocalDateTime expiry;
        int attempts;
        boolean verified;

        OtpEntry(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
            this.attempts = 0;
            this.verified = false;
        }
    }

    private final Map<String, OtpEntry> otpStore = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.security.SecureRandom secureRandom = new java.security.SecureRandom();

    public String generatePasswordResetOtp(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No registered account found with email: " + email));

        // Generate 6-digit cryptographic OTP
        int number = secureRandom.nextInt(900000) + 100000;
        String otp = String.valueOf(number);

        // Store OTP with 10-minute expiry
        otpStore.put(normalizedEmail, new OtpEntry(otp, LocalDateTime.now().plusMinutes(10)));

        // Send OTP email via SMTP with fallback logging
        emailService.sendPasswordResetEmail(normalizedEmail, otp);

        return otp;
    }

    public boolean verifyPasswordResetOtp(String email, String otp) {
        String normalizedEmail = email.trim().toLowerCase();
        OtpEntry entry = otpStore.get(normalizedEmail);

        if (entry == null) {
            throw new IllegalArgumentException("No active verification code found for this email. Please request a new code.");
        }

        if (entry.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(normalizedEmail);
            throw new IllegalArgumentException("Verification code has expired. Please request a new one.");
        }

        entry.attempts++;
        if (entry.attempts > 5) {
            otpStore.remove(normalizedEmail);
            throw new IllegalArgumentException("Too many incorrect attempts. Please request a new verification code.");
        }

        if (!entry.otp.equals(otp.trim())) {
            throw new IllegalArgumentException("Invalid verification code. Please check the code and try again.");
        }

        entry.verified = true;
        return true;
    }

    @Transactional
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        String normalizedEmail = email.trim().toLowerCase();
        OtpEntry entry = otpStore.get(normalizedEmail);

        if (entry == null || (!entry.verified && !entry.otp.equals(otp.trim()))) {
            throw new IllegalArgumentException("Verification required before password can be reset.");
        }

        if (entry.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(normalizedEmail);
            throw new IllegalArgumentException("Verification code has expired. Please request a new one.");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate OTP after successful reset
        otpStore.remove(normalizedEmail);
        loginFailures.remove(normalizedEmail);
        cooldownMap.remove(normalizedEmail);
    }

    @Transactional
    public User updateName(String email, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be blank.");
        }
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));
        user.setName(newName.trim());
        return userRepository.save(user);
    }
}
