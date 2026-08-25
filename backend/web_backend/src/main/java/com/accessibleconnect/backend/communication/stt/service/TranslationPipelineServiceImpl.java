package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.isl.entity.TranslationSequenceHistory;
import com.accessibleconnect.backend.isl.repository.TranslationSequenceHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class TranslationPipelineServiceImpl implements TranslationPipelineService {
    private static final Logger log = LoggerFactory.getLogger(TranslationPipelineServiceImpl.class);

    private final AIService aiService;
    private final ISLService islService;
    private final SignSequenceService signSequenceService;
    private final CommunicationSessionRepository sessionRepository;
    private final TranslationSequenceHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    public TranslationPipelineServiceImpl(
            AIService aiService,
            ISLService islService,
            SignSequenceService signSequenceService,
            CommunicationSessionRepository sessionRepository,
            TranslationSequenceHistoryRepository historyRepository,
            ObjectMapper objectMapper
    ) {
        this.aiService = aiService;
        this.islService = islService;
        this.signSequenceService = signSequenceService;
        this.sessionRepository = sessionRepository;
        this.historyRepository = historyRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public SignSequence translateTranscript(String sessionId, TranscriptEvent event) {
        if (event == null || !event.isFinal()) {
            log.warn("[Translation Pipeline] Rejected null or non-final event processing request.");
            throw new IllegalArgumentException("Only finalized transcript segments can be translated");
        }

        UUID sessionUuid = UUID.fromString(sessionId);

        // 1. Lock CommunicationSession row for update
        CommunicationSession session = sessionRepository.findByIdForUpdate(sessionUuid)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // 2. Check if transcriptId already processed (Idempotency checkpoint)
        Optional<TranslationSequenceHistory> existing = historyRepository.findBySourceTranscriptId(event.getId());
        if (existing.isPresent()) {
            log.info("[Translation Pipeline] Transcript {} already translated. Returning cached sequence.", event.getId());
            try {
                return objectMapper.readValue(existing.get().getPayload(), SignSequence.class);
            } catch (Exception e) {
                log.error("[Translation Pipeline] Deserialization failure on cached sequence: ", e);
                throw new RuntimeException("Deserialization of cached translation failed", e);
            }
        }

        log.info("[Translation Pipeline] Beginning translation flow: sessionId={}, transcriptId={}, text=\"{}\"",
                sessionId, event.getId(), event.getText());

        try {
            // Step 1: Speech Transcript -> Semantic Intent Representation
            SemanticRepresentation semantic = aiService.processTranscript(sessionId, event);
            if (semantic == null) {
                throw new IllegalStateException("Semantic AI processing returned null representation");
            }

            // Step 2: Semantic Intent -> ISL Intermediate Representation
            ISLRepresentation isl = islService.generateISL(sessionId, semantic);
            if (isl == null) {
                throw new IllegalStateException("ISL translation engine returned null representation");
            }

            // Step 3: ISL-IR -> Resolved Database Sign Sequence
            SignSequence sequence = signSequenceService.generateSequence(sessionId, isl);

            // 3. Increment session's sequence number count authoritatively
            long nextSeqNum = session.getLastSequenceNumber() + 1;
            session.setLastSequenceNumber(nextSeqNum);
            sessionRepository.save(session);

            // Set server-assigned properties in sequence DTO
            sequence.setSequenceNumber(nextSeqNum);
            sequence.setSourceTranscriptId(event.getId());
            sequence.setSenderId(event.getSenderId());

            // 4. Serialize sequence steps list and save to durable TranslationSequenceHistory
            String payloadJson = objectMapper.writeValueAsString(sequence);
            TranslationSequenceHistory history = new TranslationSequenceHistory(
                    UUID.randomUUID(),
                    sequence.getSequenceId(),
                    sessionUuid,
                    event.getId(),
                    event.getSenderId(),
                    nextSeqNum,
                    event.getText(),
                    sequence.getLanguage(),
                    sequence.getCreatedAt(),
                    payloadJson
            );

            historyRepository.save(history);
            log.info("[Translation Pipeline] Persistent save successful: sequenceId={}, sequenceNumber={}",
                    sequence.getSequenceId(), nextSeqNum);

            return sequence;
        } catch (Exception e) {
            log.error("[Translation Pipeline] Error executing translation pipeline: ", e);
            throw new RuntimeException("Translation pipeline failed: " + e.getMessage(), e);
        }
    }
}
