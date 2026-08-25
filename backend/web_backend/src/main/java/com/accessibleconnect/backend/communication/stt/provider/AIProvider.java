package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;

public interface AIProvider {
    SemanticRepresentation processTranscript(String sessionId, TranscriptEvent event);
}
