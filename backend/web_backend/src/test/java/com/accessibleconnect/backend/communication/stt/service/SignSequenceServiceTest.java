package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.*;
import com.accessibleconnect.backend.communication.stt.provider.MockSignAssetProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class SignSequenceServiceTest {

    private SignSequenceService sequenceService;
    private MockSignAssetProvider mockProvider;

    @BeforeEach
    public void setUp() {
        mockProvider = new MockSignAssetProvider();
        sequenceService = new SignSequenceServiceImpl(mockProvider, 1000);
    }

    @Test
    public void testBasicConversion() {
        ISLRepresentation representation = new ISLRepresentation(
                "rep-123",
                "Hello",
                "en",
                "greeting",
                List.of(
                        new ISLToken("HELLO", "HELLO", ISLTokenCategory.GREETING, "greet", 0.99, 1)
                ),
                Map.of(),
                0.99,
                System.currentTimeMillis()
        );

        SignSequence sequence = sequenceService.generateSequence("session-1", representation);

        assertNotNull(sequence);
        assertEquals("Hello", sequence.getSourceText());
        assertEquals(1, sequence.getSteps().size());
        
        SignStep step = sequence.getSteps().get(0);
        assertEquals("HELLO", step.getConceptId());
        assertEquals("HELLO", step.getDisplayToken());
        assertEquals(AssetResolutionStatus.FOUND, step.getResolutionStatus());
        assertNotNull(step.getAsset());
        assertEquals("isl-hello-v1", step.getAsset().getAssetId());
        assertEquals(1500, step.getDurationMs()); // resolves to mock asset duration
        assertEquals(0.99, step.getConfidence());
    }

    @Test
    public void testMultipleTokensAndOrderPreservation() {
        ISLRepresentation representation = new ISLRepresentation(
                "rep-124",
                "Tomorrow office go",
                "en",
                "statement",
                List.of(
                        new ISLToken("TOMORROW", "TOMORROW", ISLTokenCategory.TIME, "time", 0.95, 2),
                        new ISLToken("OFFICE", "OFFICE", ISLTokenCategory.LOCATION, "location", 0.95, 3),
                        new ISLToken("GO", "GO", ISLTokenCategory.ACTION, "action", 0.95, 4)
                ),
                Map.of(),
                0.95,
                System.currentTimeMillis()
        );

        SignSequence sequence = sequenceService.generateSequence("session-1", representation);

        assertNotNull(sequence);
        assertEquals(3, sequence.getSteps().size());

        // Assert exact order preservation
        assertEquals("TOMORROW", sequence.getSteps().get(0).getConceptId());
        assertEquals(0, sequence.getSteps().get(0).getSequenceIndex());
        assertEquals(1200, sequence.getSteps().get(0).getDurationMs());

        assertEquals("OFFICE", sequence.getSteps().get(1).getConceptId());
        assertEquals(1, sequence.getSteps().get(1).getSequenceIndex());
        assertEquals(1700, sequence.getSteps().get(1).getDurationMs());

        assertEquals("GO", sequence.getSteps().get(2).getConceptId());
        assertEquals(2, sequence.getSteps().get(2).getSequenceIndex());
        assertEquals(1000, sequence.getSteps().get(2).getDurationMs());

        assertEquals(1200 + 1700 + 1000, sequence.getTotalDurationMs());
    }

    @Test
    public void testMissingAssetHandling() {
        ISLRepresentation representation = new ISLRepresentation(
                "rep-125",
                "Unknown sign",
                "en",
                "statement",
                List.of(
                        new ISLToken("HELLO", "HELLO", ISLTokenCategory.GREETING, "greet", 0.99, 1),
                        new ISLToken("UNKNOWN_CONCEPT", "UNKNOWN_CONCEPT", ISLTokenCategory.OBJECT, "noun", 0.80, 2)
                ),
                Map.of(),
                0.90,
                System.currentTimeMillis()
        );

        SignSequence sequence = sequenceService.generateSequence("session-1", representation);

        assertNotNull(sequence);
        assertEquals(2, sequence.getSteps().size());

        // First step (found)
        assertEquals(AssetResolutionStatus.FOUND, sequence.getSteps().get(0).getResolutionStatus());

        // Second step (missing)
        SignStep missingStep = sequence.getSteps().get(1);
        assertEquals("UNKNOWN_CONCEPT", missingStep.getConceptId());
        assertEquals(AssetResolutionStatus.MISSING, missingStep.getResolutionStatus());
        assertEquals(1000, missingStep.getDurationMs()); // fallbacks to default duration
        assertNotNull(missingStep.getAsset());
        assertEquals("UNSUPPORTED", missingStep.getAsset().getAssetType());
        assertNull(missingStep.getAsset().getAssetReference());
    }

    @Test
    public void testConfidencePreservation() {
        ISLRepresentation representation = new ISLRepresentation(
                "rep-126",
                "Hi",
                "en",
                "greeting",
                List.of(
                        new ISLToken("HELLO", "HELLO", ISLTokenCategory.GREETING, "greet", 0.85, 1)
                ),
                Map.of(),
                0.85,
                System.currentTimeMillis()
        );

        SignSequence sequence = sequenceService.generateSequence("session-1", representation);
        assertEquals(0.85, sequence.getSteps().get(0).getConfidence());
    }

    @Test
    public void testEmptyRepresentation() {
        ISLRepresentation representation = new ISLRepresentation(
                "rep-127",
                "",
                "en",
                "statement",
                List.of(),
                Map.of(),
                0.0,
                System.currentTimeMillis()
        );

        SignSequence sequence = sequenceService.generateSequence("session-1", representation);
        assertNotNull(sequence);
        assertTrue(sequence.getSteps().isEmpty());
        assertEquals(0, sequence.getTotalDurationMs());
    }

    @Test
    public void testNullInput() {
        SignSequence sequence = sequenceService.generateSequence("session-1", null);
        assertNotNull(sequence);
        assertTrue(sequence.getSteps().isEmpty());
    }
}
