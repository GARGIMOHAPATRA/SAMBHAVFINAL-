package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.AssetStatus;
import com.accessibleconnect.backend.communication.stt.dto.SignAsset;
import com.accessibleconnect.backend.communication.stt.dto.VerificationStatus;
import com.accessibleconnect.backend.communication.stt.dto.StorageStatus;
import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import com.accessibleconnect.backend.isl.repository.ISLSignAssetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class DatabaseSignAssetProvider implements SignAssetProvider {
    private static final Logger log = LoggerFactory.getLogger(DatabaseSignAssetProvider.class);

    private final ISLSignAssetRepository repository;

    public DatabaseSignAssetProvider(ISLSignAssetRepository repository) {
        this.repository = repository;
    }

    @Override
    public SignAsset resolveAsset(String conceptId) {
        if (conceptId == null || conceptId.trim().isEmpty()) {
            return null;
        }

        log.info("[DB Asset Provider] Resolving active asset for concept: {}", conceptId);

        // Fetch ACTIVE assets sorted by version (highest first)
        List<ISLSignAsset> assets = repository.findActiveAssetsOrderByVersionDesc(
                conceptId.trim().toUpperCase(Locale.ROOT), "ISL", AssetStatus.ACTIVE
        );

        if (assets.isEmpty()) {
            log.warn("[DB Asset Provider] No active assets found for concept: {}", conceptId);
            return null;
        }

        ISLSignAsset selected = null;
        for (ISLSignAsset a : assets) {
            if (a.getVerificationStatus() == VerificationStatus.VERIFIED &&
                a.getStorageStatus() == StorageStatus.AVAILABLE) {
                selected = a;
                break;
            }
        }

        if (selected == null) {
            log.warn("[DB Asset Provider] No verified and available active assets found for concept: {}", conceptId);
            return null;
        }

        log.info("[DB Asset Provider] Resolved highest active version asset: {} (v{}.{})",
                selected.getConceptId(), selected.getVersionMajor(), selected.getVersionMinor());

        return new SignAsset(
                selected.getId().toString(),
                selected.getConceptId(),
                selected.getLanguage(),
                selected.getAssetType(),
                selected.getAssetReference(),
                selected.getDurationMs(),
                selected.getVersionMajor() + "." + selected.getVersionMinor(),
                selected.getStatus(),
                selected.getSource()
        );
    }
}
