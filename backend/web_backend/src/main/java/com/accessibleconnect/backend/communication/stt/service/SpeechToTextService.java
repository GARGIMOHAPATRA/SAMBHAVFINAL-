package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.provider.TranscriptCallback;

public interface SpeechToTextService {
    void startSession(String sessionId, String participantId, String participantName, String participantType, TranscriptCallback callback);
    void processAudio(String sessionId, String participantId, byte[] audioData);
    void stopSession(String sessionId, String participantId);
}
