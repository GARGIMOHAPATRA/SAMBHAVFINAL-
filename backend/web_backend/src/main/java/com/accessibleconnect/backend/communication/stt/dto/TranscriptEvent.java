package com.accessibleconnect.backend.communication.stt.dto;

public class TranscriptEvent {
    private String id;
    private String sessionId;
    private String senderId;
    private String senderName;
    private String senderType; // "COMMON_USER" | "ACCESSIBILITY_USER"
    private String text;
    @com.fasterxml.jackson.annotation.JsonProperty("isFinal")
    private boolean isFinal;
    private long timestamp;
    private double confidence;

    // Constructors
    public TranscriptEvent() {}

    public TranscriptEvent(String id, String sessionId, String senderId, String senderName, String senderType, String text, boolean isFinal, long timestamp, double confidence) {
        this.id = id;
        this.sessionId = sessionId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderType = senderType;
        this.text = text;
        this.isFinal = isFinal;
        this.timestamp = timestamp;
        this.confidence = confidence;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderType() {
        return senderType;
    }

    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isFinal")
    public boolean isFinal() {
        return isFinal;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isFinal")
    public void setFinal(boolean isFinal) {
        this.isFinal = isFinal;
    }

    public void setIsFinal(boolean isFinal) {
        this.isFinal = isFinal;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }
}
