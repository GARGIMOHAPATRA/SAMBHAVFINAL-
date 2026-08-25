package com.accessibleconnect.backend.profile.repository;

import com.accessibleconnect.backend.profile.entity.AccessibilityProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AccessibilityProfileRepository extends JpaRepository<AccessibilityProfile, UUID> {
    Optional<AccessibilityProfile> findByUserId(UUID userId);
}
