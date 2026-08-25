package com.accessibleconnect.backend.admin;

import com.accessibleconnect.backend.admin.entity.CommunicationAuditLog;
import com.accessibleconnect.backend.admin.repository.CommunicationAuditLogRepository;
import com.accessibleconnect.backend.auth.dto.LoginRequest;
import com.accessibleconnect.backend.auth.dto.RegisterRequest;
import com.accessibleconnect.backend.auth.repository.RefreshTokenRepository;
import com.accessibleconnect.backend.communication.dto.CreateCommunicationSessionRequest;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.user.entity.AccountType;
import com.accessibleconnect.backend.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "livekit.url=http://localhost:7880",
    "livekit.apiKey=test_key",
    "livekit.apiSecret=test_secret_that_is_long_enough_to_be_secure_32_chars"
})
@AutoConfigureMockMvc
public class AdminSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private CommunicationAuditLogRepository auditLogRepository;

    @Autowired
    private RefreshTokenRepository tokenRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String userToken;
    private String adminEmail = "admin@example.com";
    private String userEmail = "user@example.com";

    @BeforeEach
    public void setup() throws Exception {
        sessionRepository.deleteAll();
        auditLogRepository.deleteAll();
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        adminToken = getAccessTokenForUser(adminEmail, "Admin User", AccountType.ADMIN);
        userToken = getAccessTokenForUser(userEmail, "Normal User", AccountType.COMMON_USER);
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
    public void testAdminAccessTelemetrySuccess() throws Exception {
        mockMvc.perform(get("/api/admin/telemetry")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers", is(2)))
                .andExpect(jsonPath("$.totalAdmins", is(1)))
                .andExpect(jsonPath("$.activeSessions", is(0)));
    }

    @Test
    public void testUserAccessTelemetryRejected() throws Exception {
        mockMvc.perform(get("/api/admin/telemetry")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnauthenticatedAccessTelemetryRejected() throws Exception {
        mockMvc.perform(get("/api/admin/telemetry"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testSessionCreationAndTransitionsAudited() throws Exception {
        // 1. Create session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID sessionId = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Verify creation audit log
        List<CommunicationAuditLog> logs = auditLogRepository.findAll();
        assertFalse(logs.isEmpty());
        CommunicationAuditLog creationLog = logs.stream()
                .filter(l -> "SESSION_CREATION".equals(l.getEventType()))
                .findFirst().orElse(null);
        assertNotNull(creationLog);
        assertEquals(userEmail, creationLog.getActor());
        assertEquals("SUCCESS", creationLog.getStatus());
        assertEquals(sessionId, creationLog.getSessionId());

        // 2. Start session
        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/start")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Verify start audit log
        logs = auditLogRepository.findAll();
        CommunicationAuditLog startLog = logs.stream()
                .filter(l -> "SESSION_START".equals(l.getEventType()))
                .findFirst().orElse(null);
        assertNotNull(startLog);
        assertEquals("SUCCESS", startLog.getStatus());

        // 3. Request LiveKit token
        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/livekit-token")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Verify LiveKit token audit log
        logs = auditLogRepository.findAll();
        CommunicationAuditLog tokenLog = logs.stream()
                .filter(l -> "LIVEKIT_TOKEN_GEN".equals(l.getEventType()))
                .findFirst().orElse(null);
        assertNotNull(tokenLog);
        assertEquals("SUCCESS", tokenLog.getStatus());
        assertFalse(tokenLog.getMetadata().contains("eyJ")); // Must not contain raw token signature payload

        // 4. End session
        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/end")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Verify end audit log
        logs = auditLogRepository.findAll();
        CommunicationAuditLog endLog = logs.stream()
                .filter(l -> "SESSION_END".equals(l.getEventType()))
                .findFirst().orElse(null);
        assertNotNull(endLog);
    }

    @Test
    public void testAuditSurvivesFailedOperation() throws Exception {
        // Create session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID sessionId = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Try starting session twice (the second start will fail with INVALID_SESSION_STATE exception)
        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/start")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Second start call (should fail with BAD REQUEST)
        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/start")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest());

        // Verify that the failure audit log exists despite the transaction rollback
        List<CommunicationAuditLog> logs = auditLogRepository.findAll();
        CommunicationAuditLog failureLog = logs.stream()
                .filter(l -> "INVALID_SESSION_STATE_REQUEST".equals(l.getEventType()))
                .findFirst().orElse(null);
        
        assertNotNull(failureLog);
        assertEquals("FAILURE", failureLog.getStatus());
        assertTrue(failureLog.getMetadata().contains("Cannot start session in status: ACTIVE"));
    }

    @Test
    public void testAdminSessionCancellation() throws Exception {
        // Create session
        CreateCommunicationSessionRequest req = new CreateCommunicationSessionRequest("ONLINE");
        String response = mockMvc.perform(post("/api/communication/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID sessionId = UUID.fromString(objectMapper.readTree(response).get("id").asText());

        // Admin forces cancellation of the session
        mockMvc.perform(post("/api/admin/sessions/" + sessionId + "/cancel")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify database reflects CANCELLED state
        mockMvc.perform(get("/api/communication/sessions/" + sessionId)
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Verify cancellation audit log actor is admin
        List<CommunicationAuditLog> logs = auditLogRepository.findAll();
        CommunicationAuditLog cancelLog = logs.stream()
                .filter(l -> "ADMIN_CANCEL_SESSION".equals(l.getEventType()))
                .findFirst().orElse(null);
        assertNotNull(cancelLog);
        assertEquals(adminEmail, cancelLog.getActor());
        assertEquals("SUCCESS", cancelLog.getStatus());
    }
}
