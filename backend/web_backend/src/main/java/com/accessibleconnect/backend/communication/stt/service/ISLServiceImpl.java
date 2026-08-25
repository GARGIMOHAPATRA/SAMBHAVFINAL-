package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.ISLToken;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ISLServiceImpl implements ISLService {
    private static final Logger log = LoggerFactory.getLogger(ISLServiceImpl.class);

    private final ISLProcessor processor;

    public ISLServiceImpl(ISLProcessor processor) {
        this.processor = processor;
    }

    @Override
    public ISLRepresentation generateISL(String sessionId, SemanticRepresentation semantic) {
        if (semantic == null) {
            log.warn("[ISL Service] Semantic representation is null. Returning empty ISL-IR.");
            return new ISLRepresentation(
                    null,
                    "",
                    "en",
                    "unknown",
                    List.of(),
                    Map.of(),
                    0.0,
                    System.currentTimeMillis()
            );
        }

        log.info("[ISL Service] Building ISL-IR for text: \"{}\"", semantic.getOriginalText());

        // Process tokens through rule engine
        List<ISLToken> tokens = processor.process(semantic);

        // Compile grammatical metadata for future sequence engines
        Map<String, String> grammaticalMetadata = new HashMap<>();
        grammaticalMetadata.put("subsystem", "MVP ISL Intermediate Representation (ISL-IR)");
        grammaticalMetadata.put("disclaimer", "This MVP ISL layer is a structured semantic representation system and is NOT a complete linguistic implementation of Indian Sign Language.");

        ISLRepresentation representation = new ISLRepresentation(
                UUID.randomUUID().toString(), // Source transcript ID mapping placeholder
                semantic.getOriginalText(),
                semantic.getLanguage() != null ? semantic.getLanguage() : "en",
                semantic.getIntent() != null ? semantic.getIntent() : "informational",
                tokens,
                grammaticalMetadata,
                semantic.getConfidence(),
                System.currentTimeMillis()
        );

        log.info("[ISL Service] ISL-IR translation complete. Compiled tokens count: {}", tokens.size());
        return representation;
    }
}
