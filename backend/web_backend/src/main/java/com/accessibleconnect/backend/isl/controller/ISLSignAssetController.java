package com.accessibleconnect.backend.isl.controller;

import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import com.accessibleconnect.backend.isl.service.ISLSignAssetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/isl/assets")
public class ISLSignAssetController {
    private static final Logger log = LoggerFactory.getLogger(ISLSignAssetController.class);

    @Autowired
    private ISLSignAssetService service;

    @GetMapping
    public ResponseEntity<List<ISLSignAsset>> getAllAssets() {
        return ResponseEntity.ok(service.getAllAssets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ISLSignAsset> getAssetById(@PathVariable UUID id) {
        return service.getAssetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/concept/{conceptId}")
    public ResponseEntity<List<ISLSignAsset>> getAssetsByConcept(@PathVariable String conceptId) {
        return ResponseEntity.ok(service.getAssetsByConcept(conceptId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ISLSignAsset> createAsset(@RequestBody ISLSignAsset asset) {
        log.info("[ISL Controller] Delegated creation request to service.");
        if (isInvalid(asset)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createAsset(asset));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ISLSignAsset> updateAsset(@PathVariable UUID id, @RequestBody ISLSignAsset details) {
        log.info("[ISL Controller] Delegated details update to service.");
        if (isInvalid(details)) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(service.updateAsset(id, details));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAsset(@PathVariable UUID id) {
        log.info("[ISL Controller] Delegated deletion request to service.");
        service.deleteAsset(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ISLSignAsset> uploadMedia(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) {
        log.info("[ISL Controller] Delegated media upload to service.");
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            ISLSignAsset saved = service.uploadMedia(id, file.getBytes(), file.getContentType(), file.getSize());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            log.warn("[ISL Controller] Upload parameter validation failed: {}", e.getMessage());
            if (e.getMessage().contains("MIME type")) {
                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).build();
            }
            if (e.getMessage().contains("size")) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("[ISL Controller] Internal failure during media upload delegation: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}/media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ISLSignAsset> deleteMedia(@PathVariable UUID id) {
        log.info("[ISL Controller] Delegated media deletion to service.");
        try {
            return ResponseEntity.ok(service.deleteMedia(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/media")
    public ResponseEntity<Map<String, String>> getMediaUrl(
            @PathVariable UUID id,
            Principal principal
    ) {
        log.info("[ISL Controller] Delegated signed URL retrieval to service.");
        try {
            String url = service.generateSignedUrl(id, principal);
            return ResponseEntity.ok(Map.of("signedUrl", url));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isInvalid(ISLSignAsset asset) {
        return asset == null ||
               asset.getConceptId() == null || asset.getConceptId().trim().isEmpty() ||
               asset.getLanguage() == null || !"ISL".equalsIgnoreCase(asset.getLanguage().trim()) ||
               asset.getAssetType() == null || asset.getAssetType().trim().isEmpty() ||
               asset.getDurationMs() <= 0 ||
               asset.getVersionMajor() < 0 ||
               asset.getVersionMinor() < 0 ||
               asset.getStatus() == null ||
               asset.getVerificationStatus() == null;
    }
}
