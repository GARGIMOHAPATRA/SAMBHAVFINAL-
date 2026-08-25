package com.accessibleconnect.backend.profile.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "profile_accessibility_needs", uniqueConstraints = {
    @UniqueConstraint(name = "uq_profile_need", columnNames = {"profile_id", "need_type"})
})
public class ProfileAccessibilityNeed {

    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private AccessibilityProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(name = "need_type", nullable = false)
    private AccessibilityNeedType needType;

    public ProfileAccessibilityNeed() {}

    public ProfileAccessibilityNeed(AccessibilityProfile profile, AccessibilityNeedType needType) {
        this.profile = profile;
        this.needType = needType;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public AccessibilityProfile getProfile() { return profile; }
    public void setProfile(AccessibilityProfile profile) { this.profile = profile; }

    public AccessibilityNeedType getNeedType() { return needType; }
    public void setNeedType(AccessibilityNeedType needType) { this.needType = needType; }
}
