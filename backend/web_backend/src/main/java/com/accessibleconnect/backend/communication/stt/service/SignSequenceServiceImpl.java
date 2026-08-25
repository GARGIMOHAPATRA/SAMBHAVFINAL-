package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.*;
import com.accessibleconnect.backend.communication.stt.provider.SignAssetProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SignSequenceServiceImpl implements SignSequenceService {
    private static final Logger log = LoggerFactory.getLogger(SignSequenceServiceImpl.class);

    private final SignAssetProvider assetProvider;
    private final int defaultDurationMs;

    public SignSequenceServiceImpl(
            SignAssetProvider assetProvider,
            @Value("${app.sign-assets.default-duration-ms:1000}") int defaultDurationMs
    ) {
        this.assetProvider = assetProvider;
        this.defaultDurationMs = defaultDurationMs;
    }

    @Override
    public SignSequence generateSequence(String sessionId, ISLRepresentation representation) {
        if (representation == null) {
            log.warn("[Sign Sequence] Received null ISLRepresentation. Returning empty sequence.");
            return new SignSequence(
                    UUID.randomUUID().toString(),
                    sessionId,
                    "",
                    "ISL",
                    System.currentTimeMillis(),
                    List.of(),
                    0,
                    0.0,
                    "EMPTY"
            );
        }

        log.info("[Sign Sequence] Generating sequence for text: \"{}\"", representation.getOriginalText());

        List<SignStep> steps = new ArrayList<>();
        int index = 0;
        int totalDuration = 0;
        double sumConfidence = 0.0;

        if (representation.getTokens() != null) {
            for (ISLToken token : representation.getTokens()) {
                String concept = token.getConceptId();
                SignAsset asset = assetProvider.resolveAsset(concept);
                AssetResolutionStatus resolutionStatus;
                int duration;

                if (asset != null) {
                    resolutionStatus = AssetResolutionStatus.FOUND;
                    duration = asset.getDurationMs();
                } else {
                    resolutionStatus = AssetResolutionStatus.MISSING;
                    duration = defaultDurationMs;
                    // Create detailed unsupported fallback asset indicating why it is unsupported
                    asset = new SignAsset(
                            "unsupported-" + concept.toLowerCase(),
                            concept,
                            "ISL",
                            "UNSUPPORTED",
                            null,
                            defaultDurationMs,
                            "1.0",
                            AssetStatus.UNAVAILABLE,
                            "missing_catalog_asset"
                    );
                }

                SignStep step = new SignStep(
                        index++,
                        concept,
                        token.getDisplayToken(),
                        duration,
                        token.getConfidence(),
                        asset,
                        resolutionStatus,
                        token.getSourceConcept(),
                        0,   // preDelayMs default placeholder
                        0,   // postDelayMs default placeholder
                        "NONE" // transitionType default placeholder
                );

                steps.add(step);
                totalDuration += duration;
                sumConfidence += token.getConfidence();
            }
        }

        double overallConfidence = steps.isEmpty() ? representation.getConfidence() : (sumConfidence / steps.size());

        SignSequence sequence = new SignSequence(
                UUID.randomUUID().toString(),
                sessionId,
                representation.getOriginalText(),
                "ISL",
                System.currentTimeMillis(),
                steps,
                totalDuration,
                overallConfidence,
                steps.isEmpty() ? "EMPTY" : "RESOLVED"
        );

        log.info("[Sign Sequence] Finished sequence. Steps generated: {}, totalDurationMs: {}", steps.size(), totalDuration);
        return sequence;
    }
}
