package com.accessibleconnect.backend.communication.service;

import com.accessibleconnect.backend.communication.entity.CommunicationSession;

public interface OfflineCommunicationService {
    void initializeSession(CommunicationSession session);
}
