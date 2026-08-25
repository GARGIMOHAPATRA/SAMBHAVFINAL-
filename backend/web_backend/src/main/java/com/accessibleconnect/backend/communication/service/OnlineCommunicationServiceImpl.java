package com.accessibleconnect.backend.communication.service;

import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;

@Service
public class OnlineCommunicationServiceImpl implements OnlineCommunicationService {

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public String generateRoomCode() {
        String code;
        int maxAttempts = 50;
        int attempts = 0;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
            }
            code = sb.toString();
            attempts++;
            if (attempts > maxAttempts) {
                throw new IllegalStateException("Failed to generate a unique room code after maximum attempts.");
            }
        } while (sessionRepository.existsByRoomCode(code));
        return code;
    }
}
