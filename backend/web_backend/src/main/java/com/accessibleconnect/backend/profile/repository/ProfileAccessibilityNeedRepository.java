package com.accessibleconnect.backend.profile.repository;

import com.accessibleconnect.backend.profile.entity.ProfileAccessibilityNeed;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProfileAccessibilityNeedRepository extends JpaRepository<ProfileAccessibilityNeed, UUID> {
    void deleteByProfileId(UUID profileId);
}
