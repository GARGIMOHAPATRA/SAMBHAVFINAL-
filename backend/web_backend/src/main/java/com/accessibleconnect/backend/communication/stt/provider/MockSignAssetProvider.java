package com.accessibleconnect.backend.communication.stt.provider;

import com.accessibleconnect.backend.communication.stt.dto.AssetStatus;
import com.accessibleconnect.backend.communication.stt.dto.SignAsset;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class MockSignAssetProvider implements SignAssetProvider {
    private final Map<String, SignAsset> catalog = new HashMap<>();

    public MockSignAssetProvider() {
        catalog.put("HELLO", new SignAsset(
                "isl-hello-v1", "HELLO", "ISL", "VIDEO", "/assets/isl/hello.mp4", 1500, "1.0", AssetStatus.ACTIVE, "verified"
        ));
        catalog.put("TOMORROW", new SignAsset(
                "isl-tomorrow-v1", "TOMORROW", "ISL", "VIDEO", "/assets/isl/tomorrow.mp4", 1200, "1.0", AssetStatus.ACTIVE, "verified"
        ));
        catalog.put("OFFICE", new SignAsset(
                "isl-office-v1", "OFFICE", "ISL", "VIDEO", "/assets/isl/office.mp4", 1700, "1.0", AssetStatus.ACTIVE, "verified"
        ));
        catalog.put("GO", new SignAsset(
                "isl-go-v1", "GO", "ISL", "VIDEO", "/assets/isl/go.mp4", 1000, "1.0", AssetStatus.ACTIVE, "verified"
        ));
        catalog.put("NOT", new SignAsset(
                "isl-not-v1", "NOT", "ISL", "VIDEO", "/assets/isl/not.mp4", 800, "1.0", AssetStatus.ACTIVE, "verified"
        ));
        catalog.put("QUESTION", new SignAsset(
                "isl-question-v1", "QUESTION", "ISL", "VIDEO", "/assets/isl/question.mp4", 900, "1.0", AssetStatus.ACTIVE, "verified"
        ));
    }

    @Override
    public SignAsset resolveAsset(String conceptId) {
        if (conceptId == null) return null;
        return catalog.get(conceptId.toUpperCase());
    }
}
