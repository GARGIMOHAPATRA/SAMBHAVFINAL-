package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.communication.stt.provider.AIProvider;
import com.accessibleconnect.backend.communication.stt.provider.MockAIProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AIServiceImpl implements AIService {
    private static final Logger log = LoggerFactory.getLogger(AIServiceImpl.class);

    private final AIProvider provider;
    private final Map<String, SemanticRepresentation> cache = new ConcurrentHashMap<>();

    public AIServiceImpl(
            MockAIProvider mockProvider,
            @Value("${app.ai.provider:mock}") String providerType
    ) {
        log.info("[AI Service] Initializing with provider type: {}", providerType);
        // Map to mock provider. Extensible for GeminiAIProvider etc.
        this.provider = mockProvider;
    }

    @Override
    public SemanticRepresentation processTranscript(String sessionId, TranscriptEvent event) {
        if (event == null || event.getId() == null) {
            log.warn("[AI Service] Rejected null or invalid transcript event");
            return null;
        }

        // Deduplication Check
        String eventId = event.getId();
        if (cache.containsKey(eventId)) {
            log.info("[AI Service] Duplicate transcript detected: {}. Returning cached semantic representation.", eventId);
            return cache.get(eventId);
        }

        // Process through configured provider
        SemanticRepresentation result = provider.processTranscript(sessionId, event);
        if (result != null) {
            cache.put(eventId, result);
        }
        return result;
    }
}
