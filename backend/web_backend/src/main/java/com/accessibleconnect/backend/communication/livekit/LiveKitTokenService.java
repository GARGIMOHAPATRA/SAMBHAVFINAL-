package com.accessibleconnect.backend.communication.livekit;

import java.util.UUID;

public interface LiveKitTokenService {
    LiveKitTokenResponse generateToken(UUID sessionId, String userEmail);
}
