package com.accessibleconnect.backend.admin.service;

import com.accessibleconnect.backend.admin.entity.CommunicationAuditLog;
import com.accessibleconnect.backend.admin.repository.CommunicationAuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class CommunicationAuditServiceImpl implements CommunicationAuditService {

    @Autowired
    private CommunicationAuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String actor, String eventType, UUID sessionId, String status, String metadata, String ipAddress) {
        CommunicationAuditLog log = new CommunicationAuditLog();
        log.setId(UUID.randomUUID());
        log.setTimestamp(LocalDateTime.now());
        
        // Sanitize actor and metadata
        log.setActor(sanitizeSensitive(actor));
        log.setEventType(eventType);
        log.setSessionId(sessionId);
        log.setStatus(status);
        log.setMetadata(sanitizeSensitive(metadata));
        log.setIpAddress(ipAddress);
        
        auditLogRepository.save(log);
    }

    private String sanitizeSensitive(String input) {
        if (input == null) return null;
        // Simple redactor to prevent accidental leakage of passwords, tokens, or JWTs
        String sanitized = input;
        if (sanitized.toLowerCase().contains("bearer ") || sanitized.length() > 500) {
            sanitized = sanitized.replaceAll("Bearer\\s+[A-Za-z0-9\\-\\._~\\+\\/]+=*", "Bearer [REDACTED]");
        }
        if (sanitized.toLowerCase().contains("password")) {
            sanitized = sanitized.replaceAll("(?i)\"password\"\\s*:\\s*\"[^\"]+\"", "\"password\":\"[REDACTED]\"");
        }
        return sanitized;
    }
}
