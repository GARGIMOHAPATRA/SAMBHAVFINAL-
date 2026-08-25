package com.accessibleconnect.backend.communication.livekit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LiveKitConfig {

    @Value("${livekit.url:}")
    private String url;

    @Value("${livekit.apiKey:}")
    private String apiKey;

    @Value("${livekit.apiSecret:}")
    private String apiSecret;

    public String getUrl() {
        return url;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }
}
