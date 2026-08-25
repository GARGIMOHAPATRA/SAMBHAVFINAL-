package com.accessibleconnect.backend.communication.controller;

import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.exception.SessionNotFoundException;
import com.accessibleconnect.backend.communication.exception.UnauthorizedSessionAccessException;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.isl.entity.TranslationSequenceHistory;
import com.accessibleconnect.backend.isl.repository.TranslationSequenceHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/communication/sessions")
public class TranslationSequenceHistoryController {
    private static final Logger log = LoggerFactory.getLogger(TranslationSequenceHistoryController.class);

    private final CommunicationSessionRepository sessionRepository;
    private final TranslationSequenceHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    public TranslationSequenceHistoryController(
            CommunicationSessionRepository sessionRepository,
            TranslationSequenceHistoryRepository historyRepository,
            ObjectMapper objectMapper
    ) {
        this.sessionRepository = sessionRepository;
        this.historyRepository = historyRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/{sessionId}/sequences")
    public ResponseEntity<List<SignSequence>> getSequenceHistory(
            @PathVariable("sessionId") String sessionIdStr,
            @RequestParam(name = "afterSequence", defaultValue = "0") Long afterSequence,
            @RequestParam(name = "limit", defaultValue = "50") Integer limit,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        String userEmail = principal.getName();
        UUID sessionId;
        try {
            sessionId = UUID.fromString(sessionIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        CommunicationSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionIdStr));

        // Enforce session authorization rules: OFFLINE is creator-locked, ONLINE is active call participants
        if (session.getMode() == CommunicationMode.OFFLINE && !session.getCreator().getEmail().equals(userEmail)) {
            log.warn("[History API] Unauthorized access attempt to session: {} by user: {}", sessionIdStr, userEmail);
            throw new UnauthorizedSessionAccessException("Unauthorized access to session sequence history");
        }

        // Limit maximum records returned per batch
        int safeLimit = Math.min(limit, 100);

        List<TranslationSequenceHistory> historyList = historyRepository
                .findBySessionIdAndSequenceNumberGreaterThanOrderBySequenceNumberAsc(sessionId, afterSequence);

        List<SignSequence> sequences = historyList.stream()
                .limit(safeLimit)
                .map(h -> {
                    try {
                        return objectMapper.readValue(h.getPayload(), SignSequence.class);
                    } catch (Exception e) {
                        log.error("[History API] Deserialization failure for sequence ID: {}", h.getSequenceId(), e);
                        throw new RuntimeException("Failed to map persistent translation history record", e);
                    }
                })
                .collect(Collectors.toList());

        log.info("[History API] Returned {} sequence history records after index {} for session {}",
                sequences.size(), afterSequence, sessionIdStr);

        return ResponseEntity.ok(sequences);
    }
}
