package com.accessibleconnect.backend.communication.stt.dto;

public class ISLToken {
    private String conceptId;
    private String displayToken;
    private ISLTokenCategory category;
    private String sourceConcept;
    private double confidence;
    private int order; // MVP heuristic ordering weight

    public ISLToken() {}

    public ISLToken(String conceptId, String displayToken, ISLTokenCategory category, String sourceConcept, double confidence, int order) {
        this.conceptId = conceptId;
        this.displayToken = displayToken;
        this.category = category;
        this.sourceConcept = sourceConcept;
        this.confidence = confidence;
        this.order = order;
    }

    // Getters and Setters
    public String getConceptId() {
        return conceptId;
    }

    public void setConceptId(String conceptId) {
        this.conceptId = conceptId;
    }

    public String getDisplayToken() {
        return displayToken;
    }

    public void setDisplayToken(String displayToken) {
        this.displayToken = displayToken;
    }

    public ISLTokenCategory getCategory() {
        return category;
    }

    public void setCategory(ISLTokenCategory category) {
        this.category = category;
    }

    public String getSourceConcept() {
        return sourceConcept;
    }

    public void setSourceConcept(String sourceConcept) {
        this.sourceConcept = sourceConcept;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }
}
