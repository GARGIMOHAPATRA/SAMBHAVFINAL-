package com.accessibleconnect.backend.admin.dto;

import java.util.UUID;

public class AuditLogResponseDto {
    private UUID id;
    private String timestamp;
    private String actor;
    private String eventType;
    private UUID sessionId;
    private String status;
    private String metadata;
    private String ipAddress;

    public AuditLogResponseDto() {}

    public AuditLogResponseDto(UUID id, String timestamp, String actor, String eventType, UUID sessionId, String status, String metadata, String ipAddress) {
        this.id = id;
        this.timestamp = timestamp;
        this.actor = actor;
        this.eventType = eventType;
        this.sessionId = sessionId;
        this.status = status;
        this.metadata = metadata;
        this.ipAddress = ipAddress;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
