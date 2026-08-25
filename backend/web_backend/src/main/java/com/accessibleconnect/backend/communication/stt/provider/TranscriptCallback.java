package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;

@FunctionalInterface
public interface TranscriptCallback {
    void onTranscript(TranscriptEvent event);
}
