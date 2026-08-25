package com.accessibleconnect.backend.profile.service;

import com.accessibleconnect.backend.profile.dto.ProfileResponse;
import com.accessibleconnect.backend.profile.entity.AccessibilityNeedType;
import com.accessibleconnect.backend.profile.entity.AccessibilityProfile;
import com.accessibleconnect.backend.profile.entity.ProfileAccessibilityNeed;
import com.accessibleconnect.backend.profile.repository.AccessibilityProfileRepository;
import com.accessibleconnect.backend.profile.repository.ProfileAccessibilityNeedRepository;
import com.accessibleconnect.backend.user.entity.AccountType;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    @Autowired
    private AccessibilityProfileRepository profileRepository;

    @Autowired
    private ProfileAccessibilityNeedRepository needRepository;

    @Autowired
    private UserRepository userRepository;

    public ProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountType() != AccountType.ACCESSIBILITY_USER) {
            throw new IllegalStateException("User does not have an accessibility profile");
        }

        AccessibilityProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        return mapToResponse(profile);
    }

    @Transactional
    public ProfileResponse updateProfile(
            String email,
            String language,
            String signLanguage,
            String textSize,
            boolean highContrast,
            String commPreference,
            List<AccessibilityNeedType> needs) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountType() != AccountType.ACCESSIBILITY_USER) {
            throw new IllegalStateException("User does not have an accessibility profile");
        }

        AccessibilityProfile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        // Update fields
        profile.setPreferredLanguage(language);
        profile.setPreferredSignLanguage(signLanguage);
        profile.setTextSizePreference(textSize);
        profile.setHighContrastPreference(highContrast);
        profile.setCommunicationPreference(commPreference);

        // Update needs: delete existing and insert new
        needRepository.deleteByProfileId(profile.getId());
        profile.getNeeds().clear();

        if (needs != null && !needs.isEmpty()) {
            // Validation checks
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

            List<ProfileAccessibilityNeed> newNeeds = new ArrayList<>();
            for (AccessibilityNeedType need : needs) {
                if (need == AccessibilityNeedType.MULTIPLE_NEEDS) {
                    throw new IllegalArgumentException("MULTIPLE_NEEDS is not a selectable accessibility need");
                }
                newNeeds.add(new ProfileAccessibilityNeed(profile, need));
            }
            needRepository.saveAll(newNeeds);
            profile.setNeeds(newNeeds);
        }

        AccessibilityProfile savedProfile = profileRepository.save(profile);
        return mapToResponse(savedProfile);
    }

    private ProfileResponse mapToResponse(AccessibilityProfile profile) {
        return new ProfileResponse(
                profile.getPreferredLanguage(),
                profile.getPreferredSignLanguage(),
                profile.getTextSizePreference(),
                profile.isHighContrastPreference(),
                profile.getCommunicationPreference(),
                profile.getNeeds().stream().map(n -> n.getNeedType()).collect(Collectors.toList())
        );
    }
}
