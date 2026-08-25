package com.accessibleconnect.backend.communication.stt.dto;

import java.util.List;

public class SignSequence {
    private String sequenceId;
    private String sourceSessionId;
    private String sourceText;
    private String language;
    private long createdAt;
    private List<SignStep> steps;
    private int totalDurationMs;
    private double overallConfidence;
    private String status;
    private Long sequenceNumber;
    private String sourceTranscriptId;
    private String senderId;

    public SignSequence() {}

    public SignSequence(String sequenceId, String sourceSessionId, String sourceText, String language, long createdAt, List<SignStep> steps, int totalDurationMs, double overallConfidence, String status) {
        this.sequenceId = sequenceId;
        this.sourceSessionId = sourceSessionId;
        this.sourceText = sourceText;
        this.language = language;
        this.createdAt = createdAt;
        this.steps = steps;
        this.totalDurationMs = totalDurationMs;
        this.overallConfidence = overallConfidence;
        this.status = status;
    }

    public SignSequence(String sequenceId, String sourceSessionId, String sourceText, String language, long createdAt, List<SignStep> steps, int totalDurationMs, double overallConfidence, String status, Long sequenceNumber, String sourceTranscriptId, String senderId) {
        this.sequenceId = sequenceId;
        this.sourceSessionId = sourceSessionId;
        this.sourceText = sourceText;
        this.language = language;
        this.createdAt = createdAt;
        this.steps = steps;
        this.totalDurationMs = totalDurationMs;
        this.overallConfidence = overallConfidence;
        this.status = status;
        this.sequenceNumber = sequenceNumber;
        this.sourceTranscriptId = sourceTranscriptId;
        this.senderId = senderId;
    }

    // Getters and Setters
    public String getSequenceId() {
        return sequenceId;
    }

    public void setSequenceId(String sequenceId) {
        this.sequenceId = sequenceId;
    }

    public String getSourceSessionId() {
        return sourceSessionId;
    }

    public void setSourceSessionId(String sourceSessionId) {
        this.sourceSessionId = sourceSessionId;
    }

    public String getSourceText() {
        return sourceText;
    }

    public void setSourceText(String sourceText) {
        this.sourceText = sourceText;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public List<SignStep> getSteps() {
        return steps;
    }

    public void setSteps(List<SignStep> steps) {
        this.steps = steps;
    }

    public int getTotalDurationMs() {
        return totalDurationMs;
    }

    public void setTotalDurationMs(int totalDurationMs) {
        this.totalDurationMs = totalDurationMs;
    }

    public double getOverallConfidence() {
        return overallConfidence;
    }

    public void setOverallConfidence(double overallConfidence) {
        this.overallConfidence = overallConfidence;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(Long sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    public String getSourceTranscriptId() {
        return sourceTranscriptId;
    }

    public void setSourceTranscriptId(String sourceTranscriptId) {
        this.sourceTranscriptId = sourceTranscriptId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
}
