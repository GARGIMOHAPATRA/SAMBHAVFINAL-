package com.accessibleconnect.backend.communication.service;

import com.accessibleconnect.backend.communication.dto.CreateCommunicationSessionRequest;
import com.accessibleconnect.backend.communication.dto.CommunicationSessionResponse;
import java.util.List;
import java.util.UUID;

public interface CommunicationSessionService {
    CommunicationSessionResponse createSession(CreateCommunicationSessionRequest request, String userEmail);
    CommunicationSessionResponse getSession(UUID id, String userEmail);
    CommunicationSessionResponse getSessionByRoomCode(String roomCode, String userEmail);
    List<CommunicationSessionResponse> getSessionsForUser(String userEmail);
    CommunicationSessionResponse startSession(UUID id, String userEmail);
    CommunicationSessionResponse endSession(UUID id, String userEmail);
    CommunicationSessionResponse cancelSession(UUID id, String userEmail);
}
