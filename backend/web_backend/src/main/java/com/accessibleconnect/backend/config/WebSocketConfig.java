package com.accessibleconnect.backend.config;

import com.accessibleconnect.backend.communication.stt.handler.TranscriptWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final TranscriptWebSocketHandler transcriptWebSocketHandler;

    public WebSocketConfig(TranscriptWebSocketHandler transcriptWebSocketHandler) {
        this.transcriptWebSocketHandler = transcriptWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(transcriptWebSocketHandler, "/ws/session")
                .setAllowedOrigins("*");
    }
}
