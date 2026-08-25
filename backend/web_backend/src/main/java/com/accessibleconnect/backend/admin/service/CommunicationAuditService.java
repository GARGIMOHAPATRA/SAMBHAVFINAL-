package com.accessibleconnect.backend.admin.service;

import java.util.UUID;

public interface CommunicationAuditService {
    void logEvent(String actor, String eventType, UUID sessionId, String status, String metadata, String ipAddress);
}
