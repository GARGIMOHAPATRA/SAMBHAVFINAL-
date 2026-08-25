package com.accessibleconnect.backend.communication.stt.dto;

public class SignStep {
    private int sequenceIndex;
    private String conceptId;
    private String displayToken;
    private int durationMs;
    private double confidence;
    private SignAsset asset;
    private AssetResolutionStatus resolutionStatus;
    private String sourceConcept;

    // Transition metadata
    private int preDelayMs;
    private int postDelayMs;
    private String transitionType;

    public SignStep() {}

    public SignStep(int sequenceIndex, String conceptId, String displayToken, int durationMs, double confidence, SignAsset asset, AssetResolutionStatus resolutionStatus, String sourceConcept, int preDelayMs, int postDelayMs, String transitionType) {
        this.sequenceIndex = sequenceIndex;
        this.conceptId = conceptId;
        this.displayToken = displayToken;
        this.durationMs = durationMs;
        this.confidence = confidence;
        this.asset = asset;
        this.resolutionStatus = resolutionStatus;
        this.sourceConcept = sourceConcept;
        this.preDelayMs = preDelayMs;
        this.postDelayMs = postDelayMs;
        this.transitionType = transitionType;
    }

    // Getters and Setters
    public int getSequenceIndex() {
        return sequenceIndex;
    }

    public void setSequenceIndex(int sequenceIndex) {
        this.sequenceIndex = sequenceIndex;
    }

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

    public int getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(int durationMs) {
        this.durationMs = durationMs;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public SignAsset getAsset() {
        return asset;
    }

    public void setAsset(SignAsset asset) {
        this.asset = asset;
    }

    public AssetResolutionStatus getResolutionStatus() {
        return resolutionStatus;
    }

    public void setResolutionStatus(AssetResolutionStatus resolutionStatus) {
        this.resolutionStatus = resolutionStatus;
    }

    public String getSourceConcept() {
        return sourceConcept;
    }

    public void setSourceConcept(String sourceConcept) {
        this.sourceConcept = sourceConcept;
    }

    public int getPreDelayMs() {
        return preDelayMs;
    }

    public void setPreDelayMs(int preDelayMs) {
        this.preDelayMs = preDelayMs;
    }

    public int getPostDelayMs() {
        return postDelayMs;
    }

    public void setPostDelayMs(int postDelayMs) {
        this.postDelayMs = postDelayMs;
    }

    public String getTransitionType() {
        return transitionType;
    }

    public void setTransitionType(String transitionType) {
        this.transitionType = transitionType;
    }
}
