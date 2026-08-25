package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.isl.repository.TranslationSequenceHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

public class TranslationPipelineServiceImplTest {

    private final AIService aiService = Mockito.mock(AIService.class);
    private final ISLService islService = Mockito.mock(ISLService.class);
    private final SignSequenceService signSequenceService = Mockito.mock(SignSequenceService.class);
    private final CommunicationSessionRepository sessionRepository = Mockito.mock(CommunicationSessionRepository.class);
    private final TranslationSequenceHistoryRepository historyRepository = Mockito.mock(TranslationSequenceHistoryRepository.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final TranslationPipelineService pipelineService = new TranslationPipelineServiceImpl(
            aiService, islService, signSequenceService, sessionRepository, historyRepository, objectMapper
    );

    @Test
    public void testTranslateTranscriptSuccess() {
        String sessionId = UUID.randomUUID().toString();
        TranscriptEvent event = new TranscriptEvent("evt-1", sessionId, "user-id", "User", "COMMON_USER", "hello", true, System.currentTimeMillis(), 0.99);

        CommunicationSession session = new CommunicationSession();
        session.setId(UUID.fromString(sessionId));
        session.setLastSequenceNumber(0L);

        SemanticRepresentation semantic = new SemanticRepresentation();
        ISLRepresentation isl = new ISLRepresentation();
        SignSequence sequence = new SignSequence(
                "seq-1", sessionId, "hello", "ISL", System.currentTimeMillis(), Collections.emptyList(), 0, 0.99, "RESOLVED"
        );

        Mockito.when(sessionRepository.findByIdForUpdate(eq(UUID.fromString(sessionId)))).thenReturn(Optional.of(session));
        Mockito.when(historyRepository.findBySourceTranscriptId(eq(event.getId()))).thenReturn(Optional.empty());
        Mockito.when(aiService.processTranscript(eq(sessionId), any(TranscriptEvent.class))).thenReturn(semantic);
        Mockito.when(islService.generateISL(eq(sessionId), eq(semantic))).thenReturn(isl);
        Mockito.when(signSequenceService.generateSequence(eq(sessionId), eq(isl))).thenReturn(sequence);

        SignSequence result = pipelineService.translateTranscript(sessionId, event);

        assertNotNull(result);
        assertEquals("seq-1", result.getSequenceId());
        assertEquals("hello", result.getSourceText());
        assertEquals(1L, result.getSequenceNumber());
    }

    @Test
    public void testTranslateInterimTranscriptThrowsException() {
        String sessionId = UUID.randomUUID().toString();
        TranscriptEvent event = new TranscriptEvent("evt-1", sessionId, "user-id", "User", "COMMON_USER", "hello", false, System.currentTimeMillis(), 0.99);

        assertThrows(IllegalArgumentException.class, () -> {
            pipelineService.translateTranscript(sessionId, event);
        });
    }

    @Test
    public void testPipelineStepFailurePropagatesException() {
        String sessionId = UUID.randomUUID().toString();
        TranscriptEvent event = new TranscriptEvent("evt-1", sessionId, "user-id", "User", "COMMON_USER", "hello", true, System.currentTimeMillis(), 0.99);

        CommunicationSession session = new CommunicationSession();
        session.setId(UUID.fromString(sessionId));
        session.setLastSequenceNumber(0L);

        Mockito.when(sessionRepository.findByIdForUpdate(eq(UUID.fromString(sessionId)))).thenReturn(Optional.of(session));
        Mockito.when(historyRepository.findBySourceTranscriptId(eq(event.getId()))).thenReturn(Optional.empty());
        Mockito.when(aiService.processTranscript(eq(sessionId), any(TranscriptEvent.class)))
                .thenThrow(new RuntimeException("AI provider offline"));

        assertThrows(RuntimeException.class, () -> {
            pipelineService.translateTranscript(sessionId, event);
        });
    }
}
