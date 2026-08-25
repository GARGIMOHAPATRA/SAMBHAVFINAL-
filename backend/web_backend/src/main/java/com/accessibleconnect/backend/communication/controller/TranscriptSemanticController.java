package com.accessibleconnect.backend.communication.controller;

import com.accessibleconnect.backend.communication.stt.dto.SemanticRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.communication.stt.dto.ISLRepresentation;
import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.communication.stt.service.AIService;
import com.accessibleconnect.backend.communication.stt.service.ISLService;
import com.accessibleconnect.backend.communication.stt.service.SignSequenceService;
import com.accessibleconnect.backend.communication.stt.service.TranslationPipelineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/communication/sessions")
public class TranscriptSemanticController {
    private static final Logger log = LoggerFactory.getLogger(TranscriptSemanticController.class);

    private final AIService aiService;
    private final ISLService islService;
    private final SignSequenceService signSequenceService;
    private final TranslationPipelineService translationPipelineService;

    public TranscriptSemanticController(
            AIService aiService, 
            ISLService islService, 
            SignSequenceService signSequenceService,
            TranslationPipelineService translationPipelineService
    ) {
        this.aiService = aiService;
        this.islService = islService;
        this.signSequenceService = signSequenceService;
        this.translationPipelineService = translationPipelineService;
    }

    @PostMapping("/{sessionId}/transcripts")
    public ResponseEntity<SignSequence> processTranscript(
            @PathVariable String sessionId,
            @RequestBody TranscriptEvent event,
            Principal principal
    ) {
        String email = principal.getName();
        log.info("[AI Controller] Received transcript processing request from user={}, session={}", email, sessionId);

        try {
            if (event == null || !event.isFinal()) {
                log.warn("[AI Controller] Rejected interim or null transcript processing request");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            SignSequence sequence = translationPipelineService.translateTranscript(sessionId, event);
            if (sequence == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            return ResponseEntity.ok(sequence);
        } catch (Exception e) {
            log.error("[AI Controller] Gracefully handled error during translation pipeline collapse: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{sessionId}/isl")
    public ResponseEntity<ISLRepresentation> convertToISL(
            @PathVariable String sessionId,
            @RequestBody SemanticRepresentation semantic,
            Principal principal
    ) {
        String email = principal.getName();
        log.info("[ISL Controller] Received ISL-IR mapping request from user={}, session={}", email, sessionId);

        try {
            if (semantic == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            ISLRepresentation representation = islService.generateISL(sessionId, semantic);
            return ResponseEntity.ok(representation);
        } catch (Exception e) {
            log.error("[ISL Controller] Error converting to ISL-IR: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{sessionId}/sign-sequence")
    public ResponseEntity<SignSequence> convertToSignSequence(
            @PathVariable String sessionId,
            @RequestBody ISLRepresentation representation,
            Principal principal
    ) {
        String email = principal.getName();
        log.info("[Sequence Controller] Received SignSequence generation request from user={}, session={}", email, sessionId);

        try {
            if (representation == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            SignSequence sequence = signSequenceService.generateSequence(sessionId, representation);
            return ResponseEntity.ok(sequence);
        } catch (Exception e) {
            log.error("[Sequence Controller] Error generating sign sequence: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
