package com.accessibleconnect.backend.communication.stt.handler;

import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.communication.stt.service.SpeechToTextService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TranscriptWebSocketHandler extends AbstractWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(TranscriptWebSocketHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Map: sessionId -> (userId -> WebSocketSession)
    private static final Map<String, Map<String, WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    private final SpeechToTextService speechToTextService;

    public TranscriptWebSocketHandler(SpeechToTextService speechToTextService) {
        this.speechToTextService = speechToTextService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> params = parseQueryParams(session.getUri());
        String sessionId = params.get("sessionId");
        String userId = params.get("userId");
        String userName = params.get("userName");
        String userType = params.get("userType");

        if (sessionId == null || userId == null) {
            log.warn("[STT WS] Rejected connection due to missing sessionId or userId");
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        // Decode URL parameter names / emails safely if needed
        userName = userName != null ? java.net.URLDecoder.decode(userName, "UTF-8") : "Anonymous";
        userId = java.net.URLDecoder.decode(userId, "UTF-8");

        // Save metadata into session attributes for access during binary frames
        session.getAttributes().put("sessionId", sessionId);
        session.getAttributes().put("userId", userId);

        roomSessions.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>()).put(userId, session);

        log.info("[STT WS] Session established for user={} in room={}", userId, sessionId);

        // Start Speech-to-Text session on the backend
        speechToTextService.startSession(sessionId, userId, userName, userType, event -> {
            try {
                String json = objectMapper.writeValueAsString(event);
                TextMessage textMessage = new TextMessage(json);
                broadcastToRoom(sessionId, textMessage);
            } catch (Exception e) {
                log.error("[STT WS] Error serializing/broadcasting transcript event: ", e);
            }
        });
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        String sessionId = (String) session.getAttributes().get("sessionId");
        String userId = (String) session.getAttributes().get("userId");

        if (sessionId == null || userId == null) {
            return;
        }

        ByteBuffer payload = message.getPayload();
        byte[] audioBytes = new byte[payload.remaining()];
        payload.get(audioBytes);

        // Forward binary audio bytes to STT service
        speechToTextService.processAudio(sessionId, userId, audioBytes);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = (String) session.getAttributes().get("sessionId");
        String userId = (String) session.getAttributes().get("userId");

        if (sessionId != null && userId != null) {
            Map<String, WebSocketSession> participants = roomSessions.get(sessionId);
            if (participants != null) {
                participants.remove(userId);
                if (participants.isEmpty()) {
                    roomSessions.remove(sessionId);
                }
            }

            speechToTextService.stopSession(sessionId, userId);
            log.info("[STT WS] Session closed for user={} in room={}, status={}", userId, sessionId, status);
        }
    }

    private void broadcastToRoom(String sessionId, TextMessage message) {
        Map<String, WebSocketSession> participants = roomSessions.get(sessionId);
        if (participants == null) {
            return;
        }

        for (WebSocketSession session : participants.values()) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(message);
                    }
                } catch (IOException e) {
                    log.error("[STT WS] Failed to send message to session: {}", session.getId(), e);
                }
            }
        }
    }

    private Map<String, String> parseQueryParams(URI uri) {
        Map<String, String> queryPairs = new LinkedHashMap<>();
        if (uri == null || uri.getQuery() == null) {
            return queryPairs;
        }
        String query = uri.getQuery();
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0) {
                queryPairs.put(pair.substring(0, idx), pair.substring(idx + 1));
            }
        }
        return queryPairs;
    }
}
