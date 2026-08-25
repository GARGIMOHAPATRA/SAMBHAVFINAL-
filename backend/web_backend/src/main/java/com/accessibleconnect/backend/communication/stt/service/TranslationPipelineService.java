package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;

public interface TranslationPipelineService {
    SignSequence translateTranscript(String sessionId, TranscriptEvent event);
}
