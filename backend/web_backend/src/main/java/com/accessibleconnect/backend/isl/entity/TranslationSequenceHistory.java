package com.accessibleconnect.backend.isl.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "translation_sequences", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"sequence_id"}),
    @UniqueConstraint(columnNames = {"source_transcript_id"}),
    @UniqueConstraint(columnNames = {"session_id", "sequence_number"})
})
public class TranslationSequenceHistory {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "sequence_id", nullable = false, unique = true)
    private String sequenceId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "source_transcript_id", nullable = false, unique = true)
    private String sourceTranscriptId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "sequence_number", nullable = false)
    private Long sequenceNumber;

    @Column(name = "source_text", nullable = false, columnDefinition = "TEXT")
    private String sourceText;

    @Column(nullable = false, length = 50)
    private String language;

    @Column(nullable = false)
    private Long timestamp;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public TranslationSequenceHistory() {}

    public TranslationSequenceHistory(UUID id, String sequenceId, UUID sessionId, String sourceTranscriptId, String senderId, Long sequenceNumber, String sourceText, String language, Long timestamp, String payload) {
        this.id = id;
        this.sequenceId = sequenceId;
        this.sessionId = sessionId;
        this.sourceTranscriptId = sourceTranscriptId;
        this.senderId = senderId;
        this.sequenceNumber = sequenceNumber;
        this.sourceText = sourceText;
        this.language = language;
        this.timestamp = timestamp;
        this.payload = payload;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getSequenceId() {
        return sequenceId;
    }

    public void setSequenceId(String sequenceId) {
        this.sequenceId = sequenceId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
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

    public Long getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(Long sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
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

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
