package com.accessibleconnect.backend.communication;

import com.accessibleconnect.backend.auth.dto.LoginRequest;
import com.accessibleconnect.backend.auth.dto.RegisterRequest;
import com.accessibleconnect.backend.communication.dto.CreateCommunicationSessionRequest;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.user.entity.AccountType;
import com.accessibleconnect.backend.user.repository.UserRepository;
import com.accessibleconnect.backend.auth.repository.RefreshTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "livekit.url=http://localhost:7880",
    "livekit.apiKey=test_key",
    "livekit.apiSecret=test_secret_that_is_long_enough_to_be_secure_32_chars"
})
@AutoConfigureMockMvc
public class LiveKitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private RefreshTokenRepository tokenRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String user1Token;
    private String user2Token;
    private String user1Email = "user1@example.com";
    private String user2Email = "user2@example.com";

    @BeforeEach
    public void setup() throws Exception {
        sessionRepository.deleteAll();
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        user1Token = getAccessTokenForUser(user1Email, "User One", AccountType.COMMON_USER);
        user2Token = getAccessTokenForUser(user2Email, "User Two", AccountType.COMMON_USER);
    }

    private String getAccessTokenForUser(String email, String name, AccountType type) throws Exception {
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName(name);
        registerReq.setEmail(email);
        registerReq.setPassword("Password123!");
        registerReq.setAccountType(type);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail(email);
        loginReq.setPassword("Password123!");

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("accessToken").asText();
    }

    @Test
    public void testGetTokenForOnlineSessionSuccess() throws Exception {
        // Create ONLINE session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Get LiveKit Token
        mockMvc.perform(post("/api/communication/sessions/" + id + "/livekit-token")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.url", notNullValue()))
                .andExpect(jsonPath("$.roomName", notNullValue()))
                .andExpect(jsonPath("$.participantIdentity", is(user1Email)))
                .andExpect(jsonPath("$.*", not(hasItem("your_livekit_api_secret"))));
    }

    @Test
    public void testGetTokenUnauthenticatedRejected() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(post("/api/communication/sessions/" + randomId + "/livekit-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testGetTokenForOfflineSessionRejected() throws Exception {
        // Create OFFLINE session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("OFFLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Get LiveKit Token
        mockMvc.perform(post("/api/communication/sessions/" + id + "/livekit-token")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testGetTokenForNonExistentSessionReturns404() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(post("/api/communication/sessions/" + randomId + "/livekit-token")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testGetTokenForCancelledSessionRejected() throws Exception {
        // Create ONLINE session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Cancel session
        mockMvc.perform(post("/api/communication/sessions/" + id + "/cancel")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        // Try getting token
        mockMvc.perform(post("/api/communication/sessions/" + id + "/livekit-token")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testGetTokenForEndedSessionRejected() throws Exception {
        // Create ONLINE session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Start session
        mockMvc.perform(post("/api/communication/sessions/" + id + "/start")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        // End session
        mockMvc.perform(post("/api/communication/sessions/" + id + "/end")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        // Try getting token
        mockMvc.perform(post("/api/communication/sessions/" + id + "/livekit-token")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isBadRequest());
    }
}
