package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.provider.MockSpeechToTextProvider;
import com.accessibleconnect.backend.communication.stt.provider.SpeechToTextProvider;
import com.accessibleconnect.backend.communication.stt.provider.TranscriptCallback;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SpeechToTextServiceImpl implements SpeechToTextService {
    private static final Logger log = LoggerFactory.getLogger(SpeechToTextServiceImpl.class);

    private final SpeechToTextProvider provider;

    public SpeechToTextServiceImpl(
            MockSpeechToTextProvider mockProvider,
            @Value("${app.stt.provider:mock}") String providerType
    ) {
        log.info("[STT Service] Initializing with provider type: {}", providerType);
        // By default, map to the mock provider. Future adapters can be injected and resolved here.
        this.provider = mockProvider;
    }

    @Override
    public void startSession(String sessionId, String participantId, String participantName, String participantType, TranscriptCallback callback) {
        try {
            provider.startSession(sessionId, participantId, participantName, participantType, callback);
        } catch (Exception e) {
            log.error("[STT Service] Error starting session: ", e);
        }
    }

    @Override
    public void processAudio(String sessionId, String participantId, byte[] audioData) {
        try {
            provider.processAudio(sessionId, participantId, audioData);
        } catch (Exception e) {
            log.error("[STT Service] Error processing audio data: ", e);
        }
    }

    @Override
    public void stopSession(String sessionId, String participantId) {
        try {
            provider.stopSession(sessionId, participantId);
        } catch (Exception e) {
            log.error("[STT Service] Error stopping session: ", e);
        }
    }
}
