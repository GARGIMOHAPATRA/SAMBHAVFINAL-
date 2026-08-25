package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.AssetStatus;
import com.accessibleconnect.backend.communication.stt.dto.SignAsset;
import com.accessibleconnect.backend.communication.stt.dto.VerificationStatus;
import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import com.accessibleconnect.backend.isl.repository.ISLSignAssetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class DatabaseSignAssetProviderTest {

    @Autowired
    private ISLSignAssetRepository repository;

    @Autowired
    private DatabaseSignAssetProvider provider;

    @Test
    public void testActiveAssetResolvesCorrectly() {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_TEST", "HELLO_TEST", "ISL", "VIDEO", "/assets/hello.mp4", 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test_source"
        );
        repository.save(asset);

        SignAsset resolved = provider.resolveAsset("HELLO_TEST");
        assertNotNull(resolved);
        assertEquals("HELLO_TEST", resolved.getConceptId());
        assertEquals("VIDEO", resolved.getAssetType());
        assertEquals("/assets/hello.mp4", resolved.getAssetReference());
        assertEquals(AssetStatus.ACTIVE, resolved.getStatus());
    }

    @Test
    public void testInactiveAssetIsIgnored() {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "TOMORROW_TEST", "TOMORROW_TEST", "ISL", "VIDEO", "/assets/tomorrow.mp4", 1200, "HD", 1, 0,
                AssetStatus.IN_REVIEW, VerificationStatus.IN_REVIEW, "test_source"
        );
        repository.save(asset);

        SignAsset resolved = provider.resolveAsset("TOMORROW_TEST");
        assertNull(resolved);
    }

    @Test
    public void testLatestVersionPriority() {
        // v1.0 ACTIVE
        ISLSignAsset assetV1 = new ISLSignAsset(
                UUID.randomUUID(), "GO_TEST", "GO_TEST", "ISL", "VIDEO", "/assets/go-v1.mp4", 1000, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test_source"
        );
        repository.save(assetV1);

        // v1.2 ACTIVE
        ISLSignAsset assetV12 = new ISLSignAsset(
                UUID.randomUUID(), "GO_TEST", "GO_TEST", "ISL", "VIDEO", "/assets/go-v1.2.mp4", 1100, "HD", 1, 2,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test_source"
        );
        repository.save(assetV12);

        // v2.0 IN_REVIEW
        ISLSignAsset assetV2InReview = new ISLSignAsset(
                UUID.randomUUID(), "GO_TEST", "GO_TEST", "ISL", "VIDEO", "/assets/go-v2.mp4", 1200, "HD", 2, 0,
                AssetStatus.IN_REVIEW, VerificationStatus.IN_REVIEW, "test_source"
        );
        repository.save(assetV2InReview);

        // Under this configuration, v1.2 is the highest active version
        SignAsset resolved = provider.resolveAsset("GO_TEST");
        assertNotNull(resolved);
        assertEquals("1.2", resolved.getVersion());
        assertEquals("/assets/go-v1.2.mp4", resolved.getAssetReference());

        // Make v2.0 ACTIVE and verify it overrides
        assetV2InReview.setStatus(AssetStatus.ACTIVE);
        assetV2InReview.setVerificationStatus(VerificationStatus.VERIFIED);
        repository.save(assetV2InReview);

        SignAsset resolvedNew = provider.resolveAsset("GO_TEST");
        assertNotNull(resolvedNew);
        assertEquals("2.0", resolvedNew.getVersion());
        assertEquals("/assets/go-v2.mp4", resolvedNew.getAssetReference());
    }

    @Test
    public void testWrongLanguageIgnored() {
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "NOT_TEST", "NOT_TEST", "ASL", "VIDEO", "/assets/not.mp4", 800, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "test_source"
        );
        repository.save(asset);

        SignAsset resolved = provider.resolveAsset("NOT_TEST");
        assertNull(resolved);
    }
}
