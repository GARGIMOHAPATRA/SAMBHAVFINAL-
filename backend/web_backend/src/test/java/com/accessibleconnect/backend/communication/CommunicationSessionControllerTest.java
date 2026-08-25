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

@SpringBootTest
@AutoConfigureMockMvc
public class CommunicationSessionControllerTest {

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
    public void testCreateOnlineSession() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.mode", is("ONLINE")))
                .andExpect(jsonPath("$.status", is("CREATED")))
                .andExpect(jsonPath("$.roomCode", notNullValue()))
                .andExpect(jsonPath("$.roomCode", hasLength(6)));
    }

    @Test
    public void testCreateOfflineSession() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("OFFLINE");

        mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.mode", is("OFFLINE")))
                .andExpect(jsonPath("$.status", is("CREATED")))
                .andExpect(jsonPath("$.roomCode", nullValue()));
    }

    @Test
    public void testGetSession() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        mockMvc.perform(get("/api/communication/sessions/" + id)
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(id.toString())))
                .andExpect(jsonPath("$.mode", is("ONLINE")));
    }

    @Test
    public void testStartSession() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        mockMvc.perform(post("/api/communication/sessions/" + id + "/start")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.startedAt", notNullValue()));
    }

    @Test
    public void testEndSession() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Start it
        mockMvc.perform(post("/api/communication/sessions/" + id + "/start")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        // End it
        mockMvc.perform(post("/api/communication/sessions/" + id + "/end")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ENDED")))
                .andExpect(jsonPath("$.endedAt", notNullValue()));
    }

    @Test
    public void testCancelSession() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        mockMvc.perform(post("/api/communication/sessions/" + id + "/cancel")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.endedAt", notNullValue()));
    }

    @Test
    public void testInvalidTransition() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Call End on a CREATED session (invalid state transition)
        mockMvc.perform(post("/api/communication/sessions/" + id + "/end")
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_SESSION_STATE")));
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");

        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + user1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Mutate session using user2's token (unauthorized)
        mockMvc.perform(post("/api/communication/sessions/" + id + "/start")
                .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED_ACCESS")));
    }

    @Test
    public void testMissingSession() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(get("/api/communication/sessions/" + randomId)
                .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("SESSION_NOT_FOUND")));
    }
}
