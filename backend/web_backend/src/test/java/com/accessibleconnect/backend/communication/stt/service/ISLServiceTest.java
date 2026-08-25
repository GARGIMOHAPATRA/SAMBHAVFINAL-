package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.ISLTokenCategory;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.rule.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ISLServiceTest {

    private ISLService islService;

    @BeforeEach
    public void setUp() {
        List<ISLRule> rules = List.of(
                new GreetingRule(),
                new TimeRule(),
                new LocationRule(),
                new ActionRule(),
                new QuestionRule(),
                new NegationRule()
        );
        ISLProcessor processor = new ISLProcessor(rules);
        islService = new ISLServiceImpl(processor);
    }

    @Test
    public void testGreetingToISL() {
        SemanticRepresentation semantic = new SemanticRepresentation(
                "Hello there!",
                "en",
                "greeting",
                "greet",
                List.of(),
                "now",
                "conversation start",
                0.99,
                System.currentTimeMillis()
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);

        assertNotNull(representation);
        assertEquals(1, representation.getTokens().size());
        ISLToken token = representation.getTokens().get(0);
        assertEquals("HELLO", token.getConceptId());
        assertEquals("HELLO", token.getDisplayToken());
        assertEquals(ISLTokenCategory.GREETING, token.getCategory());
        assertEquals(1, token.getOrder());
        assertEquals(0.99, representation.getConfidence());
    }

    @Test
    public void testActionToISL() {
        SemanticRepresentation semantic = new SemanticRepresentation(
                "Go now",
                "en",
                "informational",
                "go",
                List.of(),
                "now",
                "general talk",
                0.95,
                System.currentTimeMillis()
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);

        assertNotNull(representation);
        assertEquals(1, representation.getTokens().size());
        ISLToken token = representation.getTokens().get(0);
        assertEquals("GO", token.getConceptId());
        assertEquals(ISLTokenCategory.ACTION, token.getCategory());
        assertEquals(4, token.getOrder());
    }

    @Test
    public void testTimePlusActionOrdering() {
        SemanticRepresentation semantic = new SemanticRepresentation(
                "Go tomorrow",
                "en",
                "informational",
                "go",
                List.of(),
                "tomorrow",
                "general talk",
                0.95,
                System.currentTimeMillis()
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);

        assertNotNull(representation);
        assertEquals(2, representation.getTokens().size());
        
        // Assert MVP heuristic ordering: TIME (2) before ACTION (4)
        assertEquals(ISLTokenCategory.TIME, representation.getTokens().get(0).getCategory());
        assertEquals("TOMORROW", representation.getTokens().get(0).getConceptId());
        
        assertEquals(ISLTokenCategory.ACTION, representation.getTokens().get(1).getCategory());
        assertEquals("GO", representation.getTokens().get(1).getConceptId());
    }

    @Test
    public void testLocationPlusActionOrdering() {
        List<SemanticRepresentation.Entity> entities = List.of(
                new SemanticRepresentation.Entity("location", "office")
        );
        SemanticRepresentation semantic = new SemanticRepresentation(
                "Go to office",
                "en",
                "informational",
                "go",
                entities,
                "now",
                "general talk",
                0.95,
                System.currentTimeMillis()
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);

        assertNotNull(representation);
        assertEquals(2, representation.getTokens().size());

        // Assert MVP heuristic ordering: LOCATION (3) before ACTION (4)
        assertEquals(ISLTokenCategory.LOCATION, representation.getTokens().get(0).getCategory());
        assertEquals("OFFICE", representation.getTokens().get(0).getConceptId());

        assertEquals(ISLTokenCategory.ACTION, representation.getTokens().get(1).getCategory());
        assertEquals("GO", representation.getTokens().get(1).getConceptId());
    }

    @Test
    public void testQuestionIntent() {
        SemanticRepresentation semantic = new SemanticRepresentation(
                "Where go?",
                "en",
                "question",
                "go",
                List.of(),
                "now",
                "query",
                0.90,
                System.currentTimeMillis()
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);

        assertNotNull(representation);
        assertEquals(2, representation.getTokens().size());
        
        // Question marker order = 5, Action order = 4
        assertEquals(ISLTokenCategory.ACTION, representation.getTokens().get(0).getCategory());
        assertEquals(ISLTokenCategory.QUESTION, representation.getTokens().get(1).getCategory());
        assertEquals("QUESTION", representation.getTokens().get(1).getConceptId());
    }

    @Test
    public void testNegationRule() {
        SemanticRepresentation semantic = new SemanticRepresentation(
                "I will not go",
                "en",
                "negation",
                "go",
                List.of(),
                "now",
                "refusal",
                0.95,
                System.currentTimeMillis()
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);

        assertNotNull(representation);
        assertEquals(2, representation.getTokens().size());
        
        // Negation marker order = 6, Action order = 4
        assertEquals(ISLTokenCategory.ACTION, representation.getTokens().get(0).getCategory());
        assertEquals(ISLTokenCategory.NEGATION, representation.getTokens().get(1).getCategory());
        assertEquals("NOT", representation.getTokens().get(1).getConceptId());
    }

    @Test
    public void testNullInputHandledSafely() {
        ISLRepresentation representation = islService.generateISL("session-1", null);
        assertNotNull(representation);
        assertTrue(representation.getTokens().isEmpty());
    }

    @Test
    public void testEmptyFieldsHandledSafely() {
        SemanticRepresentation semantic = new SemanticRepresentation(
                "",
                null,
                null,
                null,
                null,
                null,
                null,
                0.0,
                0L
        );

        ISLRepresentation representation = islService.generateISL("session-1", semantic);
        assertNotNull(representation);
        assertTrue(representation.getTokens().isEmpty());
        assertEquals("en", representation.getSourceLanguage());
    }
}
