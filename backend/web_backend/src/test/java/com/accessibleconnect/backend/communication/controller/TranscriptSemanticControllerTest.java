package com.accessibleconnect.backend.communication.controller;

import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.communication.stt.service.TranslationPipelineService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class TranscriptSemanticControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TranslationPipelineService pipelineService;

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testProcessTranscriptSuccess() throws Exception {
        String sessionId = UUID.randomUUID().toString();
        TranscriptEvent event = new TranscriptEvent("test-id", sessionId, "user-id", "User", "COMMON_USER", "hello", true, System.currentTimeMillis(), 0.95);

        SignSequence mockSequence = new SignSequence(
                UUID.randomUUID().toString(),
                sessionId,
                "hello",
                "ISL",
                System.currentTimeMillis(),
                Collections.emptyList(),
                1000,
                0.95,
                "RESOLVED"
        );

        Mockito.when(pipelineService.translateTranscript(eq(sessionId), any(TranscriptEvent.class)))
                .thenReturn(mockSequence);

        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/transcripts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(event)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceText").value("hello"))
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = {"USER"})
    public void testProcessInterimTranscriptRejected() throws Exception {
        String sessionId = UUID.randomUUID().toString();
        TranscriptEvent event = new TranscriptEvent("test-id", sessionId, "user-id", "User", "COMMON_USER", "hello", false, System.currentTimeMillis(), 0.95);

        mockMvc.perform(post("/api/communication/sessions/" + sessionId + "/transcripts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(event)))
                .andExpect(status().isBadRequest());
    }
}
