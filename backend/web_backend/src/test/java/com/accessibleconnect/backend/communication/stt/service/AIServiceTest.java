package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.communication.stt.provider.MockAIProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AIServiceTest {

    private AIService aiService;
    private MockAIProvider mockProvider;

    @BeforeEach
    public void setUp() {
        mockProvider = new MockAIProvider();
        aiService = new AIServiceImpl(mockProvider, "mock");
    }

    @Test
    public void testFinalTranscriptReachesAIService() {
        TranscriptEvent event = new TranscriptEvent(
                "evt-123",
                "session-123",
                "user-123",
                "User Name",
                "COMMON_USER",
                "Hello, can you hear me clearly?",
                true,
                System.currentTimeMillis(),
                0.99
        );

        SemanticRepresentation representation = aiService.processTranscript("session-123", event);

        assertNotNull(representation);
        assertEquals("Hello, can you hear me clearly?", representation.getOriginalText());
        assertEquals("greeting", representation.getIntent());
        assertEquals("greet", representation.getAction());
        assertEquals("conversation start", representation.getPurpose());
    }

    @Test
    public void testEmptyTranscriptHandledSafely() {
        TranscriptEvent event = new TranscriptEvent(
                "evt-124",
                "session-123",
                "user-123",
                "User Name",
                "COMMON_USER",
                "",
                true,
                System.currentTimeMillis(),
                0.0
        );

        SemanticRepresentation representation = aiService.processTranscript("session-123", event);

        assertNotNull(representation);
        assertEquals("", representation.getOriginalText());
        assertEquals("informational", representation.getIntent());
        assertEquals("speak", representation.getAction());
    }

    @Test
    public void testDeduplicationAndExactlyOnceProcessing() {
        TranscriptEvent event = new TranscriptEvent(
                "evt-dup",
                "session-123",
                "user-123",
                "User Name",
                "COMMON_USER",
                "Hello",
                true,
                System.currentTimeMillis(),
                0.95
        );

        // First call - processed by provider
        SemanticRepresentation rep1 = aiService.processTranscript("session-123", event);
        assertNotNull(rep1);

        // Second call with same event ID - should return cached instance immediately
        SemanticRepresentation rep2 = aiService.processTranscript("session-123", event);
        assertNotNull(rep2);
        assertSame(rep1, rep2); // Reference comparison: exact same object instance
    }

    @Test
    public void testNullEventHandledGracefully() {
        SemanticRepresentation representation = aiService.processTranscript("session-123", null);
        assertNull(representation);
    }
}
