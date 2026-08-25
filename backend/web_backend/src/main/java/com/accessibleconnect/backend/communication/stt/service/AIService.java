package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;

public interface AIService {
    SemanticRepresentation processTranscript(String sessionId, TranscriptEvent event);
}
