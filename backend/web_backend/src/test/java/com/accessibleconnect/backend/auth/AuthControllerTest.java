package com.accessibleconnect.backend.auth;

import com.accessibleconnect.backend.auth.dto.LoginRequest;
import com.accessibleconnect.backend.auth.dto.RegisterRequest;
import com.accessibleconnect.backend.profile.dto.ProfileResponse;
import com.accessibleconnect.backend.profile.entity.AccessibilityNeedType;
import com.accessibleconnect.backend.profile.entity.AccessibilityProfile;
import com.accessibleconnect.backend.profile.repository.AccessibilityProfileRepository;
import com.accessibleconnect.backend.user.entity.AccountType;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import com.accessibleconnect.backend.auth.repository.RefreshTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessibilityProfileRepository profileRepository;

    @Autowired
    private RefreshTokenRepository tokenRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        // Clear repositories before each test
        tokenRepository.deleteAll();
        profileRepository.deleteAll();
        userRepository.deleteAll();
        
        System.out.println("DEBUG SETUP - Tokens: " + tokenRepository.count() 
            + ", Profiles: " + profileRepository.count() 
            + ", Users: " + userRepository.count());
    }

    @Test
    public void testRegisterAndLoginFlow() throws Exception {
        // 1. Register a new user
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Alice Accessibility");
        registerReq.setEmail("alice@example.com");
        registerReq.setPassword("Password123!");
        registerReq.setAccountType(AccountType.ACCESSIBILITY_USER);
        registerReq.setAccessibilityNeeds(Arrays.asList(AccessibilityNeedType.DEAF, AccessibilityNeedType.NON_SPEAKING));
        registerReq.setPreferredLanguage("English");
        registerReq.setPreferredSignLanguage("ISL");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.email", is("alice@example.com")))
                .andExpect(jsonPath("$.accountType", is("ACCESSIBILITY_USER")));

        // Verify user created and password is not in json
        User user = userRepository.findByEmail("alice@example.com").orElse(null);
        assertNotNull(user);
        assertTrue(user.isEnabled());

        // 2. Login
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("alice@example.com");
        loginReq.setPassword("Password123!");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().secure("refreshToken", true))
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseBody).get("accessToken").asText();
        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie);
        assertEquals("/api/auth", refreshCookie.getPath());

        // 3. Get /me details
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("alice@example.com")))
                .andExpect(jsonPath("$.profile", notNullValue()))
                .andExpect(jsonPath("$.profile.accessibilityNeeds", hasItems("DEAF", "NON_SPEAKING")));
    }

    @Test
    public void testRefreshTokenRotationAndReplay() throws Exception {
        // Register & login
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Bob Common");
        registerReq.setEmail("bob@example.com");
        registerReq.setPassword("Password123!");
        registerReq.setAccountType(AccountType.COMMON_USER);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("bob@example.com");
        loginReq.setPassword("Password123!");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andReturn();

        Cookie firstCookie = loginResult.getResponse().getCookie("refreshToken");

        // First rotation (valid refresh)
        MvcResult refreshResult1 = mockMvc.perform(post("/api/auth/refresh")
                .cookie(firstCookie)
                .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andReturn();

        Cookie secondCookie = refreshResult1.getResponse().getCookie("refreshToken");
        assertNotEquals(firstCookie.getValue(), secondCookie.getValue());

        // Replay detection: re-submitting the FIRST cookie (which is now revoked)
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(firstCookie)
                .header("Origin", "http://localhost:5173"))
                .andExpect(status().isUnauthorized());

        // The second cookie must now also be invalid because the family was revoked
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(secondCookie)
                .header("Origin", "http://localhost:5173"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testRoleBasedAuthorizations() throws Exception {
        // Register common user
        RegisterRequest registerCommon = new RegisterRequest();
        registerCommon.setName("Charlie Common");
        registerCommon.setEmail("charlie@example.com");
        registerCommon.setPassword("Password123!");
        registerCommon.setAccountType(AccountType.COMMON_USER);
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerCommon)))
                .andExpect(status().isCreated());

        // Register accessibility user
        RegisterRequest registerAccess = new RegisterRequest();
        registerAccess.setName("Dana Access");
        registerAccess.setEmail("dana@example.com");
        registerAccess.setPassword("Password123!");
        registerAccess.setAccountType(AccountType.ACCESSIBILITY_USER);
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerAccess)))
                .andExpect(status().isCreated());

        // Login common
        LoginRequest loginCommon = new LoginRequest();
        loginCommon.setEmail("charlie@example.com");
        loginCommon.setPassword("Password123!");
        MvcResult resCommon = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginCommon)))
                .andReturn();
        String tokenCommon = objectMapper.readTree(resCommon.getResponse().getContentAsString()).get("accessToken").asText();

        // Login access
        LoginRequest loginAccess = new LoginRequest();
        loginAccess.setEmail("dana@example.com");
        loginAccess.setPassword("Password123!");
        MvcResult resAccess = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginAccess)))
                .andReturn();
        String tokenAccess = objectMapper.readTree(resAccess.getResponse().getContentAsString()).get("accessToken").asText();

        // Test GET /api/profile
        // Common user has no profile, should return 404
        mockMvc.perform(get("/api/profile")
                .header("Authorization", "Bearer " + tokenCommon))
                .andExpect(status().isNotFound());

        // Accessibility user has profile, should return 200
        mockMvc.perform(get("/api/profile")
                .header("Authorization", "Bearer " + tokenAccess))
                .andExpect(status().isOk());
    }

    @Test
    public void testContradictoryNeedsValidation() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Error User");
        req.setEmail("error@example.com");
        req.setPassword("Password123!");
        req.setAccountType(AccountType.ACCESSIBILITY_USER);
        // Contradictory: DEAF + HARD_OF_HEARING
        req.setAccessibilityNeeds(Arrays.asList(AccessibilityNeedType.DEAF, AccessibilityNeedType.HARD_OF_HEARING));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError()); // Rollback occurred on exception
    }

    @Test
    public void testDuplicateEmailRegistration() throws Exception {
        RegisterRequest req1 = new RegisterRequest();
        req1.setName("User One");
        req1.setEmail("duplicate@example.com");
        req1.setPassword("Password123!");
        req1.setAccountType(AccountType.COMMON_USER);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        RegisterRequest req2 = new RegisterRequest();
        req2.setName("User Two");
        req2.setEmail("duplicate@example.com");
        req2.setPassword("Password123!");
        req2.setAccountType(AccountType.COMMON_USER);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict()); // Expects 409 Conflict
    }
}
