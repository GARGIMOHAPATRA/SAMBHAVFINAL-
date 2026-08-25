package com.accessibleconnect.backend.profile.dto;

import com.accessibleconnect.backend.profile.entity.AccessibilityNeedType;
import java.util.List;

public class ProfileResponse {
    private String preferredLanguage;
    private String preferredSignLanguage;
    private String textSizePreference;
    private boolean highContrastPreference;
    private String communicationPreference;
    private List<AccessibilityNeedType> accessibilityNeeds;

    public ProfileResponse() {}

    public ProfileResponse(String preferredLanguage, String preferredSignLanguage, String textSizePreference,
                           boolean highContrastPreference, String communicationPreference, List<AccessibilityNeedType> accessibilityNeeds) {
        this.preferredLanguage = preferredLanguage;
        this.preferredSignLanguage = preferredSignLanguage;
        this.textSizePreference = textSizePreference;
        this.highContrastPreference = highContrastPreference;
        this.communicationPreference = communicationPreference;
        this.accessibilityNeeds = accessibilityNeeds;
    }

    // Getters and Setters
    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getPreferredSignLanguage() { return preferredSignLanguage; }
    public void setPreferredSignLanguage(String preferredSignLanguage) { this.preferredSignLanguage = preferredSignLanguage; }

    public String getTextSizePreference() { return textSizePreference; }
    public void setTextSizePreference(String textSizePreference) { this.textSizePreference = textSizePreference; }

    public boolean isHighContrastPreference() { return highContrastPreference; }
    public void setHighContrastPreference(boolean highContrastPreference) { this.highContrastPreference = highContrastPreference; }

    public String getCommunicationPreference() { return communicationPreference; }
    public void setCommunicationPreference(String communicationPreference) { this.communicationPreference = communicationPreference; }

    public List<AccessibilityNeedType> getAccessibilityNeeds() { return accessibilityNeeds; }
    public void setAccessibilityNeeds(List<AccessibilityNeedType> accessibilityNeeds) { this.accessibilityNeeds = accessibilityNeeds; }
}
