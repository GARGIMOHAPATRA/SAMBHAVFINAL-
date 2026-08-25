package com.accessibleconnect.backend.communication.livekit;

import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.entity.CommunicationSessionStatus;
import com.accessibleconnect.backend.communication.exception.InvalidSessionStateException;
import com.accessibleconnect.backend.communication.exception.SessionNotFoundException;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class LiveKitTokenServiceImpl implements LiveKitTokenService {

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LiveKitConfig liveKitConfig;

    @Autowired
    private com.accessibleconnect.backend.admin.service.CommunicationAuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public LiveKitTokenResponse generateToken(UUID sessionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + userEmail));

        CommunicationSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Communication session not found: " + sessionId));

        // 1. Verify that the session mode is ONLINE
        if (session.getMode() != CommunicationMode.ONLINE) {
            throw new InvalidSessionStateException("Cannot request LiveKit credentials for an OFFLINE session.");
        }

        // 2. Reject CANCELLED or ENDED sessions
        if (session.getStatus() == CommunicationSessionStatus.ENDED || 
            session.getStatus() == CommunicationSessionStatus.CANCELLED) {
            throw new InvalidSessionStateException("Cannot obtain a token for an ended or cancelled session.");
        }

        // 3. Verify LiveKit configuration values are valid
        String apiKey = liveKitConfig.getApiKey();
        String apiSecret = liveKitConfig.getApiSecret();
        String url = liveKitConfig.getUrl();
        if (apiKey == null || apiKey.trim().isEmpty() ||
            apiSecret == null || apiSecret.trim().isEmpty()) {
            throw new IllegalStateException("LiveKit API Key or API Secret is not configured on the server.");
        }

        // 4. Generate token using official LiveKit SDK AccessToken
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setIdentity(user.getEmail());
        token.setName(user.getName());
        token.setTtl(3600000L); // Token valid for 1 hour (in milliseconds)

        // Grant appropriate room permissions
        token.addGrants(
                new RoomJoin(true),
                new RoomName(session.getRoomCode()),
                new CanPublish(true),
                new CanSubscribe(true)
        );

        auditService.logEvent(userEmail, "LIVEKIT_TOKEN_GEN", session.getId(), "SUCCESS", "Room Code: " + session.getRoomCode(), null);
        return new LiveKitTokenResponse(
                url,
                token.toJwt(),
                session.getRoomCode(),
                user.getEmail()
        );
    }
}
