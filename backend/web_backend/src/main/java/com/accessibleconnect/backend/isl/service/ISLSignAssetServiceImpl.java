package com.accessibleconnect.backend.isl.service;

import com.accessibleconnect.backend.communication.stt.dto.AssetStatus;
import com.accessibleconnect.backend.communication.stt.dto.StorageStatus;
import com.accessibleconnect.backend.communication.stt.dto.VerificationStatus;
import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import com.accessibleconnect.backend.isl.repository.ISLSignAssetRepository;
import com.accessibleconnect.backend.storage.SignAssetStorageProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ISLSignAssetServiceImpl implements ISLSignAssetService {
    private static final Logger log = LoggerFactory.getLogger(ISLSignAssetServiceImpl.class);

    private final ISLSignAssetRepository repository;
    private final SignAssetStorageProvider storageProvider;
    private final String bucketName;
    private final int expirationSeconds;
    private final int maxFileSizeMb;

    public ISLSignAssetServiceImpl(
            ISLSignAssetRepository repository,
            SignAssetStorageProvider storageProvider,
            @Value("${app.supabase.storage-bucket:isl-sign-assets}") String bucketName,
            @Value("${app.sign-assets.signed-url-expiration-seconds:300}") int expirationSeconds,
            @Value("${app.sign-assets.max-file-size-mb:50}") int maxFileSizeMb
    ) {
        this.repository = repository;
        this.storageProvider = storageProvider;
        this.bucketName = bucketName;
        this.expirationSeconds = expirationSeconds;
        this.maxFileSizeMb = maxFileSizeMb;
    }

    @Override
    public List<ISLSignAsset> getAllAssets() {
        return repository.findAll();
    }

    @Override
    public Optional<ISLSignAsset> getAssetById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public List<ISLSignAsset> getAssetsByConcept(String conceptId) {
        return repository.findByConceptIdIgnoreCase(conceptId);
    }

    @Override
    @Transactional
    public ISLSignAsset createAsset(ISLSignAsset asset) {
        log.info("[Audit Log] Admin initiated sign asset creation: concept={}", asset.getConceptId());
        asset.setStorageStatus(StorageStatus.PENDING);
        return repository.save(asset);
    }

    @Override
    @Transactional
    public ISLSignAsset updateAsset(UUID id, ISLSignAsset details) {
        log.info("[Audit Log] Admin initiated asset details update: id={}", id);
        return repository.findById(id).map(asset -> {
            asset.setConceptId(details.getConceptId());
            asset.setDisplayToken(details.getDisplayToken());
            asset.setLanguage(details.getLanguage());
            asset.setAssetType(details.getAssetType());
            asset.setAssetReference(details.getAssetReference());
            asset.setDurationMs(details.getDurationMs());
            asset.setQuality(details.getQuality());
            asset.setVersionMajor(details.getVersionMajor());
            asset.setVersionMinor(details.getVersionMinor());
            asset.setStatus(details.getStatus());
            asset.setVerificationStatus(details.getVerificationStatus());
            asset.setSource(details.getSource());
            if (details.getStorageStatus() != null) {
                asset.setStorageStatus(details.getStorageStatus());
            }
            return repository.save(asset);
        }).orElseThrow(() -> new IllegalArgumentException("Asset not found for id: " + id));
    }

    @Override
    @Transactional
    public void deleteAsset(UUID id) {
        log.info("[Audit Log] Admin initiated asset deletion: id={}", id);
        repository.findById(id).ifPresent(asset -> {
            // Lifecycle-based deactivation: soft-delete to preserve history integrity
            if (asset.getStoragePath() != null) {
                try {
                    storageProvider.delete(bucketName, asset.getStoragePath());
                } catch (Exception e) {
                    log.error("[Audit Log] Storage delete failed during asset deletion: path={}", asset.getStoragePath(), e);
                }
            }
            asset.setStatus(AssetStatus.UNAVAILABLE);
            asset.setVerificationStatus(VerificationStatus.DRAFT);
            asset.setStorageStatus(StorageStatus.DELETED);
            repository.save(asset);
        });
    }

    @Override
    public ISLSignAsset uploadMedia(UUID id, byte[] fileData, String contentType, long fileSize) {
        log.info("[Audit Log] Admin initiated media upload for asset id: {}", id);

        // Validations
        if (fileData == null || fileData.length == 0) {
            throw new IllegalArgumentException("Upload file is empty");
        }

        // Validate MIME type
        if (contentType == null || (!contentType.equals("video/mp4") && !contentType.equals("video/webm"))) {
            throw new IllegalArgumentException("MIME type not supported: " + contentType);
        }

        // Validate Size
        long maxBytes = (long) maxFileSizeMb * 1024 * 1024;
        if (fileSize > maxBytes) {
            throw new IllegalArgumentException("File size exceeds max allowed limit of " + maxFileSizeMb + "MB");
        }

        // File-signature magic bytes validation
        if (!validateMagicBytes(fileData, contentType)) {
            throw new IllegalArgumentException("File magic bytes signature validation failed. File content type is invalid.");
        }

        ISLSignAsset asset = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        // Generate predictable path preventing name collisions: isl/{conceptId}/v{major}.{minor}/{uuid}.mp4
        String ext = contentType.equals("video/webm") ? ".webm" : ".mp4";
        String uuidStr = UUID.randomUUID().toString();
        String path = "isl/" + asset.getConceptId().toUpperCase() + "/v" +
                asset.getVersionMajor() + "." + asset.getVersionMinor() + "/" + uuidStr + ext;

        // If it was already uploaded previously, do a cleanup of the old file (idempotent overwrite protection)
        String oldPath = asset.getStoragePath();
        if (oldPath != null) {
            try {
                storageProvider.delete(bucketName, oldPath);
            } catch (Exception e) {
                log.warn("[Audit Log] Failed to purge older storage file before replacement: path={}", oldPath, e);
            }
        }

        // 1. Upload to Supabase first
        storageProvider.upload(bucketName, path, fileData, contentType);

        // 2. Update PostgreSQL database metadata. If database update throws an exception, rollback database and delete file from storage.
        try {
            asset.setStorageProvider("SUPABASE");
            asset.setStorageBucket(bucketName);
            asset.setStoragePath(path);
            asset.setMimeType(contentType);
            asset.setFileSizeBytes(fileSize);
            asset.setAssetReference(path);
            asset.setStatus(AssetStatus.IN_REVIEW);
            asset.setVerificationStatus(VerificationStatus.IN_REVIEW);
            asset.setStorageStatus(StorageStatus.AVAILABLE);

            ISLSignAsset saved = repository.save(asset);
            log.info("[Audit Log] Media uploaded and metadata registered successfully at path: {}", path);
            return saved;
        } catch (Exception e) {
            // Compensation step: delete orphaned file from Supabase
            log.error("[Audit Log] Database save failed after successful storage upload. Initiating rollback compensation...", e);
            try {
                storageProvider.delete(bucketName, path);
                log.info("[Audit Log] Rollback compensation successful. Purged orphaned file at path: {}", path);
            } catch (Exception cleanupError) {
                // Critical alert logged to recover orphaned files later
                log.error("[ORPHAN CLEANUP FAILURE] Failed to purge orphaned storage file at path: {}", path, cleanupError);
            }
            throw new RuntimeException("Failed to persist asset storage metadata: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ISLSignAsset deleteMedia(UUID id) {
        log.info("[Audit Log] Admin initiated media deletion request: id={}", id);
        ISLSignAsset asset = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found for id: " + id));

        if (asset.getStoragePath() == null) {
            throw new IllegalArgumentException("Asset has no associated storage media");
        }

        try {
            storageProvider.delete(bucketName, asset.getStoragePath());
        } catch (Exception e) {
            log.error("[Audit Log] Failed to delete file from Supabase during media purge: ", e);
        }

        asset.setStorageProvider(null);
        asset.setStorageBucket(null);
        asset.setStoragePath(null);
        asset.setMimeType(null);
        asset.setFileSizeBytes(null);
        asset.setAssetReference(null);
        asset.setStatus(AssetStatus.UNAVAILABLE);
        asset.setVerificationStatus(VerificationStatus.DRAFT);
        asset.setStorageStatus(StorageStatus.DELETED);

        return repository.save(asset);
    }

    @Override
    public String generateSignedUrl(UUID id, Principal principal) {
        ISLSignAsset asset = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found for id: " + id));

        if (asset.getStoragePath() == null || asset.getStorageStatus() != StorageStatus.AVAILABLE) {
            throw new IllegalArgumentException("Media is unavailable for playback");
        }

        // Playback checks: non-admins can only play ACTIVE + VERIFIED + AVAILABLE assets
        boolean isAdmin = false;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        }
        if (!isAdmin && (asset.getStatus() != AssetStatus.ACTIVE || asset.getVerificationStatus() != VerificationStatus.VERIFIED)) {
            log.warn("[Security Violation] Unauthorised user requested playback URL for unverified asset: {}", id);
            throw new SecurityException("Access to unverified media is restricted");
        }

        log.info("[Audit Log] Generating signed URL preview for asset ID: {}", id);
        return storageProvider.generateSignedUrl(bucketName, asset.getStoragePath(), expirationSeconds);
    }

    private boolean validateMagicBytes(byte[] fileData, String contentType) {
        if (fileData == null || fileData.length < 8) return false;
        if ("video/mp4".equalsIgnoreCase(contentType)) {
            // Check for 'ftyp' signature starting at offset 4
            String ftyp = new String(fileData, 4, 4);
            return ftyp.equals("ftyp");
        } else if ("video/webm".equalsIgnoreCase(contentType)) {
            // EBML magic bytes: 1A 45 DF A3
            return (fileData[0] & 0xFF) == 0x1A &&
                   (fileData[1] & 0xFF) == 0x45 &&
                   (fileData[2] & 0xFF) == 0xDF &&
                   (fileData[3] & 0xFF) == 0xA3;
        }
        return false;
    }
}
