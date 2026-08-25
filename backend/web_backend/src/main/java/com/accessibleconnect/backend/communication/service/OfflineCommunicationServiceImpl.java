package com.accessibleconnect.backend.communication.service;

import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import org.springframework.stereotype.Service;

@Service
public class OfflineCommunicationServiceImpl implements OfflineCommunicationService {

    @Override
    public void initializeSession(CommunicationSession session) {
        // Phase 3A: Abstraction only. No computer vision, MediaPipe, speech synthesis, or AI APIs are run yet.
    }
}
