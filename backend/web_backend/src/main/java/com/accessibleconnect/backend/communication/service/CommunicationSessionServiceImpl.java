package com.accessibleconnect.backend.communication.service;

import com.accessibleconnect.backend.communication.dto.CreateCommunicationSessionRequest;
import com.accessibleconnect.backend.communication.dto.CommunicationSessionResponse;
import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.entity.CommunicationSessionStatus;
import com.accessibleconnect.backend.communication.exception.InvalidSessionStateException;
import com.accessibleconnect.backend.communication.exception.SessionNotFoundException;
import com.accessibleconnect.backend.communication.exception.UnauthorizedSessionAccessException;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CommunicationSessionServiceImpl implements CommunicationSessionService {

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OnlineCommunicationService onlineService;

    @Autowired
    private OfflineCommunicationService offlineService;

    @Autowired
    private com.accessibleconnect.backend.admin.service.CommunicationAuditService auditService;

    @Override
    public CommunicationSessionResponse createSession(CreateCommunicationSessionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        CommunicationMode mode;
        try {
            mode = CommunicationMode.valueOf(request.getMode().toUpperCase());
        } catch (Exception e) {
            throw new InvalidSessionStateException("Invalid communication mode: " + request.getMode());
        }

        CommunicationSession session = new CommunicationSession();
        session.setCreator(user);
        session.setMode(mode);
        session.setStatus(CommunicationSessionStatus.CREATED);

        if (mode == CommunicationMode.ONLINE) {
            String roomCode = onlineService.generateRoomCode();
            session.setRoomCode(roomCode);
        } else {
            session.setRoomCode(null);
            offlineService.initializeSession(session);
        }

        CommunicationSession saved = sessionRepository.save(session);
        auditService.logEvent(userEmail, "SESSION_CREATION", saved.getId(), "SUCCESS", "Mode: " + saved.getMode().name(), null);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CommunicationSessionResponse getSession(UUID id, String userEmail) {
        CommunicationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + id));

        // Security check: restrict OFFLINE session details to the creator
        if (session.getMode() == CommunicationMode.OFFLINE && !session.getCreator().getEmail().equals(userEmail)) {
            throw new UnauthorizedSessionAccessException("Unauthorized access to offline session details.");
        }

        return mapToResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public CommunicationSessionResponse getSessionByRoomCode(String roomCode, String userEmail) {
        CommunicationSession session = sessionRepository.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new SessionNotFoundException("Session not found with room code: " + roomCode));

        if (session.getMode() == CommunicationMode.OFFLINE && !session.getCreator().getEmail().equals(userEmail)) {
            throw new UnauthorizedSessionAccessException("Unauthorized access to offline session details.");
        }

        return mapToResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunicationSessionResponse> getSessionsForUser(String userEmail) {
        return sessionRepository.findByCreatorEmail(userEmail).stream()
                .sorted((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CommunicationSessionResponse startSession(UUID id, String userEmail) {
        CommunicationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + id));

        validateCreatorOrAdmin(session, userEmail);

        if (session.getStatus() != CommunicationSessionStatus.CREATED && 
            session.getStatus() != CommunicationSessionStatus.WAITING) {
            throw new InvalidSessionStateException("Cannot start session in status: " + session.getStatus());
        }

        session.setStatus(CommunicationSessionStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());

        if (session.getMode() == CommunicationMode.ONLINE) {
            // Future real-time WebRTC orchestration hooks
        } else {
            offlineService.initializeSession(session);
        }

        CommunicationSession saved = sessionRepository.save(session);
        auditService.logEvent(userEmail, "SESSION_START", saved.getId(), "SUCCESS", "Status: " + saved.getStatus().name(), null);
        return mapToResponse(saved);
    }

    @Override
    public CommunicationSessionResponse endSession(UUID id, String userEmail) {
        CommunicationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + id));

        validateCreatorOrAdmin(session, userEmail);

        if (session.getStatus() != CommunicationSessionStatus.ACTIVE) {
            throw new InvalidSessionStateException("Cannot end session in status: " + session.getStatus());
        }

        session.setStatus(CommunicationSessionStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());

        CommunicationSession saved = sessionRepository.save(session);
        auditService.logEvent(userEmail, "SESSION_END", saved.getId(), "SUCCESS", "Status: " + saved.getStatus().name(), null);
        return mapToResponse(saved);
    }

    @Override
    public CommunicationSessionResponse cancelSession(UUID id, String userEmail) {
        CommunicationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + id));

        validateCreatorOrAdmin(session, userEmail);

        if (session.getStatus() != CommunicationSessionStatus.CREATED && 
            session.getStatus() != CommunicationSessionStatus.WAITING) {
            throw new InvalidSessionStateException("Cannot cancel session in status: " + session.getStatus());
        }

        session.setStatus(CommunicationSessionStatus.CANCELLED);
        session.setEndedAt(LocalDateTime.now());

        CommunicationSession saved = sessionRepository.save(session);
        auditService.logEvent(userEmail, "SESSION_CANCEL", saved.getId(), "SUCCESS", "Status: " + saved.getStatus().name(), null);
        return mapToResponse(saved);
    }

    private void validateCreatorOrAdmin(CommunicationSession session, String userEmail) {
        if (session.getCreator().getEmail().equals(userEmail)) {
            return;
        }
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null && user.getAccountType() == com.accessibleconnect.backend.user.entity.AccountType.ADMIN) {
            return; // Admin bypass allowed
        }
        throw new UnauthorizedSessionAccessException("User is not the creator of this session.");
    }

    private CommunicationSessionResponse mapToResponse(CommunicationSession session) {
        return new CommunicationSessionResponse(
                session.getId(),
                session.getCreator().getId(),
                session.getCreator().getName(),
                session.getMode().name(),
                session.getStatus().name(),
                session.getRoomCode(),
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getUpdatedAt()
        );
    }
}
