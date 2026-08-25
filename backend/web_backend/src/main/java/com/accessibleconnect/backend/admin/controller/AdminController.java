package com.accessibleconnect.backend.admin.controller;

import com.accessibleconnect.backend.admin.dto.AdminTelemetryDto;
import com.accessibleconnect.backend.admin.dto.AdminUserResponseDto;
import com.accessibleconnect.backend.admin.dto.AuditLogResponseDto;
import com.accessibleconnect.backend.admin.entity.CommunicationAuditLog;
import com.accessibleconnect.backend.admin.repository.CommunicationAuditLogRepository;
import com.accessibleconnect.backend.admin.service.CommunicationAuditService;
import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.entity.CommunicationSessionStatus;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.communication.service.CommunicationSessionService;
import com.accessibleconnect.backend.user.entity.AccountType;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private CommunicationSessionService sessionService;

    @Autowired
    private CommunicationAuditLogRepository auditLogRepository;

    @Autowired
    private CommunicationAuditService auditService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @GetMapping("/telemetry")
    public ResponseEntity<AdminTelemetryDto> getTelemetry() {
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.findAll().stream()
                .filter(u -> u.getAccountType() == AccountType.ADMIN)
                .count();

        long activeSessions = sessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == CommunicationSessionStatus.ACTIVE)
                .count();
        long totalSessions = sessionRepository.count();
        long onlineSessions = sessionRepository.findAll().stream()
                .filter(s -> s.getMode() == CommunicationMode.ONLINE)
                .count();
        long offlineSessions = sessionRepository.findAll().stream()
                .filter(s -> s.getMode() == CommunicationMode.OFFLINE)
                .count();

        long tokenAllocations = auditLogRepository.findAll().stream()
                .filter(l -> "LIVEKIT_TOKEN_GEN".equalsIgnoreCase(l.getEventType()))
                .count();

        long failedAccessAttempts = auditLogRepository.findAll().stream()
                .filter(l -> "ACCESS_DENIED".equalsIgnoreCase(l.getStatus()) || "FAILURE".equalsIgnoreCase(l.getStatus()))
                .count();

        AdminTelemetryDto dto = new AdminTelemetryDto(
                activeSessions, totalSessions, onlineSessions, offlineSessions,
                totalUsers, totalAdmins, tokenAllocations, failedAccessAttempts
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogResponseDto>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "") String actor,
            @RequestParam(defaultValue = "") String eventType) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<CommunicationAuditLog> logsPage;

        if (!actor.isEmpty() && !eventType.isEmpty()) {
            logsPage = auditLogRepository.findByActorContainingIgnoreCaseAndEventTypeContainingIgnoreCase(actor, eventType, pageable);
        } else if (!actor.isEmpty()) {
            logsPage = auditLogRepository.findByActorContainingIgnoreCase(actor, pageable);
        } else if (!eventType.isEmpty()) {
            logsPage = auditLogRepository.findByEventTypeContainingIgnoreCase(eventType, pageable);
        } else {
            logsPage = auditLogRepository.findAll(pageable);
        }

        Page<AuditLogResponseDto> dtoPage = logsPage.map(log -> new AuditLogResponseDto(
                log.getId(),
                log.getTimestamp().format(FORMATTER),
                log.getActor(),
                log.getEventType(),
                log.getSessionId(),
                log.getStatus(),
                log.getMetadata(),
                log.getIpAddress()
        ));

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponseDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "") String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> usersPage;

        if (!search.isEmpty()) {
            usersPage = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pageable);
        } else {
            usersPage = userRepository.findAll(pageable);
        }

        Page<AdminUserResponseDto> dtoPage = usersPage.map(user -> new AdminUserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getAccountType().name(),
                user.isEnabled(),
                user.getCreatedAt().format(FORMATTER)
        ));

        return ResponseEntity.ok(dtoPage);
    }

    @PostMapping("/sessions/{id}/cancel")
    public ResponseEntity<Void> cancelSession(@PathVariable UUID id, HttpServletRequest request) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        String ipAddress = request.getRemoteAddr();

        try {
            // Cancel session using existing lifecycle logic
            sessionService.cancelSession(id, adminEmail);
            
            // Audit the successful action
            auditService.logEvent(
                    adminEmail,
                    "ADMIN_CANCEL_SESSION",
                    id,
                    "SUCCESS",
                    "Administrator explicitly cancelled stuck communication session: " + id,
                    ipAddress
            );
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Audit the failed cancellation action
            auditService.logEvent(
                    adminEmail,
                    "ADMIN_CANCEL_SESSION",
                    id,
                    "FAILURE",
                    "Failed to cancel session: " + e.getMessage(),
                    ipAddress
            );
            throw e;
        }
    }
}
