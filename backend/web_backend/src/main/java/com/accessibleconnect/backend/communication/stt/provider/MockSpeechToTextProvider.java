package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MockSpeechToTextProvider implements SpeechToTextProvider {
    private static final Logger log = LoggerFactory.getLogger(MockSpeechToTextProvider.class);

    // Simulated phrases cycle
    private static final String[][] DIALOGUES = {
        {"Hello", "can", "you", "hear", "me", "clearly?"},
        {"Yes,", "I", "can", "hear", "you", "perfectly", "now."},
        {"Welcome", "to", "the", "SignBridge", "real-time", "session."},
        {"This", "transcription", "is", "being", "generated", "dynamically", "on", "the", "backend."},
        {"We", "are", "supporting", "both", "interim", "and", "final", "results", "over", "WebSockets."},
        {"Everything", "is", "fully", "connected", "and", "running", "smoothly."}
    };

    private static class ParticipantState {
        int dialogueIndex = 0;
        int wordIndex = 0;
        long lastProcessedTime = 0;
        String lastEventId = UUID.randomUUID().toString();
    }

    private final Map<String, TranscriptCallback> callbacks = new ConcurrentHashMap<>();
    private final Map<String, ParticipantState> states = new ConcurrentHashMap<>();

    @Override
    public void startSession(String sessionId, String participantId, String participantName, String participantType, TranscriptCallback callback) {
        String key = sessionId + "-" + participantId;
        callbacks.put(key, callback);
        states.put(key, new ParticipantState());
        log.info("[STT Mock] Session started for session={}, participant={}", sessionId, participantId);
    }

    @Override
    public void processAudio(String sessionId, String participantId, byte[] audioData) {
        String key = sessionId + "-" + participantId;
        TranscriptCallback callback = callbacks.get(key);
        ParticipantState state = states.get(key);

        if (callback == null || state == null) {
            return;
        }

        long now = System.currentTimeMillis();
        // Throttle processing to simulate transcription rate (approx 400ms per word chunk)
        if (now - state.lastProcessedTime < 400) {
            return;
        }
        state.lastProcessedTime = now;

        String[] currentDialogue = DIALOGUES[state.dialogueIndex];
        state.wordIndex++;

        boolean isFinal = state.wordIndex >= currentDialogue.length;
        
        // Build the text segment up to the current word index
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(state.wordIndex, currentDialogue.length); i++) {
            if (i > 0) sb.append(" ");
            sb.append(currentDialogue[i]);
        }
        String text = sb.toString();

        // Reuse the same event ID for interim updates so the client knows it is the same sentence block
        String eventId = state.lastEventId;

        TranscriptEvent event = new TranscriptEvent(
            eventId,
            sessionId,
            participantId,
            participantId.contains("@") ? participantId.split("@")[0] : "Participant", // fallback friendly name
            participantId.contains("accessibility") ? "ACCESSIBILITY_USER" : "COMMON_USER", // default based on identity
            text,
            isFinal,
            now,
            isFinal ? 0.98 : 0.75
        );

        callback.onTranscript(event);

        if (isFinal) {
            log.info("[STT Mock] Final transcript generated: \"{}\"", text);
            // Move to next dialogue block and reset word pointer
            state.dialogueIndex = (state.dialogueIndex + 1) % DIALOGUES.length;
            state.wordIndex = 0;
            state.lastEventId = UUID.randomUUID().toString(); // Generate new ID for next sentence
        } else {
            log.debug("[STT Mock] Interim transcript generated: \"{}\"", text);
        }
    }

    @Override
    public void stopSession(String sessionId, String participantId) {
        String key = sessionId + "-" + participantId;
        callbacks.remove(key);
        states.remove(key);
        log.info("[STT Mock] Session stopped for session={}, participant={}", sessionId, participantId);
    }
}
