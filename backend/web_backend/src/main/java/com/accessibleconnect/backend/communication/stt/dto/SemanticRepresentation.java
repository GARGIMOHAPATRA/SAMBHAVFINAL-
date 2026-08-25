package com.accessibleconnect.backend.communication.stt.dto;

import java.util.List;

public class SemanticRepresentation {
    private String originalText;
    private String language;
    private String intent;
    private String action;
    private List<Entity> entities;
    private String time;
    private String purpose;
    private double confidence;
    private long timestamp;

    public static class Entity {
        private String type;
        private String value;

        public Entity() {}

        public Entity(String type, String value) {
            this.type = type;
            this.value = value;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }

    public SemanticRepresentation() {}

    public SemanticRepresentation(String originalText, String language, String intent, String action, List<Entity> entities, String time, String purpose, double confidence, long timestamp) {
        this.originalText = originalText;
        this.language = language;
        this.intent = intent;
        this.action = action;
        this.entities = entities;
        this.time = time;
        this.purpose = purpose;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public List<Entity> getEntities() {
        return entities;
    }

    public void setEntities(List<Entity> entities) {
        this.entities = entities;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
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
