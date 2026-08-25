package com.accessibleconnect.backend.communication.stt.dto;

public class SignAsset {
    private String assetId;
    private String conceptId;
    private String language;
    private String assetType;
    private String assetReference;
    private int durationMs;
    private String version;
    private AssetStatus status;
    private String source;

    public SignAsset() {}

    public SignAsset(String assetId, String conceptId, String language, String assetType, String assetReference, int durationMs, String version, AssetStatus status, String source) {
        this.assetId = assetId;
        this.conceptId = conceptId;
        this.language = language;
        this.assetType = assetType;
        this.assetReference = assetReference;
        this.durationMs = durationMs;
        this.version = version;
        this.status = status;
        this.source = source;
    }

    // Getters and Setters
    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public String getConceptId() {
        return conceptId;
    }

    public void setConceptId(String conceptId) {
        this.conceptId = conceptId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public String getAssetReference() {
        return assetReference;
    }

    public void setAssetReference(String assetReference) {
        this.assetReference = assetReference;
    }

    public int getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(int durationMs) {
        this.durationMs = durationMs;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
