package com.accessibleconnect.backend.profile.controller;

import com.accessibleconnect.backend.profile.dto.ProfileResponse;
import com.accessibleconnect.backend.profile.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        try {
            ProfileResponse response = profileService.getProfileByEmail(email);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(404).build(); // 404 for non-accessibility users
        }
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(@RequestBody ProfileResponse request) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        ProfileResponse response = profileService.updateProfile(
                email,
                request.getPreferredLanguage(),
                request.getPreferredSignLanguage(),
                request.getTextSizePreference(),
                request.isHighContrastPreference(),
                request.getCommunicationPreference(),
                request.getAccessibilityNeeds()
        );
        return ResponseEntity.ok(response);
    }
}
