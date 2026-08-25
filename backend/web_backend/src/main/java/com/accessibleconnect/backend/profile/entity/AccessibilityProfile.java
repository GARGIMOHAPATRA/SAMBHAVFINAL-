package com.accessibleconnect.backend.profile.entity;

import com.accessibleconnect.backend.user.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "accessibility_profiles")
public class AccessibilityProfile {

    @Id
    private UUID id = UUID.randomUUID();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(name = "preferred_language")
    private String preferredLanguage;

    @Column(name = "preferred_sign_language")
    private String preferredSignLanguage;

    @Column(name = "text_size_preference")
    private String textSizePreference;

    @Column(name = "high_contrast_preference")
    private boolean highContrastPreference = false;

    @Column(name = "communication_preference")
    private String communicationPreference;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProfileAccessibilityNeed> needs = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public AccessibilityProfile() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public List<ProfileAccessibilityNeed> getNeeds() { return needs; }
    public void setNeeds(List<ProfileAccessibilityNeed> needs) { this.needs = needs; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
