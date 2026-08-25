package com.accessibleconnect.backend.communication.stt.dto;

import java.util.List;
import java.util.Map;

public class ISLRepresentation {
    private String sourceTranscriptId;
    private String originalText;
    private String sourceLanguage;
    private String intent;
    private List<ISLToken> tokens;
    private Map<String, String> grammaticalMetadata;
    private double confidence;
    private long timestamp;

    public ISLRepresentation() {}

    public ISLRepresentation(String sourceTranscriptId, String originalText, String sourceLanguage, String intent, List<ISLToken> tokens, Map<String, String> grammaticalMetadata, double confidence, long timestamp) {
        this.sourceTranscriptId = sourceTranscriptId;
        this.originalText = originalText;
        this.sourceLanguage = sourceLanguage;
        this.intent = intent;
        this.tokens = tokens;
        this.grammaticalMetadata = grammaticalMetadata;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getSourceTranscriptId() {
        return sourceTranscriptId;
    }

    public void setSourceTranscriptId(String sourceTranscriptId) {
        this.sourceTranscriptId = sourceTranscriptId;
    }

    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getSourceLanguage() {
        return sourceLanguage;
    }

    public void setSourceLanguage(String sourceLanguage) {
        this.sourceLanguage = sourceLanguage;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public List<ISLToken> getTokens() {
        return tokens;
    }

    public void setTokens(List<ISLToken> tokens) {
        this.tokens = tokens;
    }

    public Map<String, String> getGrammaticalMetadata() {
        return grammaticalMetadata;
    }

    public void setGrammaticalMetadata(Map<String, String> grammaticalMetadata) {
        this.grammaticalMetadata = grammaticalMetadata;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
