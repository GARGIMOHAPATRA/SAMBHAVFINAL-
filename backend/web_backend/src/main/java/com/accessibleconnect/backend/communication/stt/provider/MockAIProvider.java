package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class MockAIProvider implements AIProvider {
    private static final Logger log = LoggerFactory.getLogger(MockAIProvider.class);

    @Override
    public SemanticRepresentation processTranscript(String sessionId, TranscriptEvent event) {
        log.info("[AI Mock] Processing finalized transcript for session={}, id={}, text=\"{}\"", 
                sessionId, event.getId(), event.getText());

        String text = event.getText().toLowerCase(Locale.ROOT);
        String intent = "informational";
        String action = "speak";
        String purpose = "general conversation";
        String time = "now";
        List<SemanticRepresentation.Entity> entities = new ArrayList<>();

        // Keyword mapping
        if (text.contains("hello") || text.contains("hi")) {
            intent = "greeting";
            action = "greet";
            purpose = "conversation start";
        } else if (text.contains("hear") || text.contains("audio")) {
            intent = "status_check";
            action = "verify_audio";
            purpose = "connection check";
        } else if (text.contains("welcome")) {
            intent = "greeting";
            action = "welcome_participant";
            purpose = "session start";
        } else if (text.contains("transcription") || text.contains("websocket")) {
            intent = "status_info";
            action = "log_transcription";
            purpose = "STT demonstration";
        } else if (text.contains("tomorrow")) {
            intent = "schedule_request";
            action = "set_meeting";
            time = "tomorrow";
            purpose = "project discussion";
            entities.add(new SemanticRepresentation.Entity("time", "tomorrow"));
        }

        // Entity detection
        if (text.contains("signbridge")) {
            entities.add(new SemanticRepresentation.Entity("platform", "SignBridge"));
        }
        if (text.contains("office")) {
            entities.add(new SemanticRepresentation.Entity("location", "office"));
        }

        SemanticRepresentation representation = new SemanticRepresentation(
                event.getText(),
                "en",
                intent,
                action,
                entities,
                time,
                purpose,
                0.96,
                System.currentTimeMillis()
        );

        log.info("[AI Mock] Semantic processing complete. Intent resolved: {}", intent);
        return representation;
    }
}
