package com.accessibleconnect.backend.config;

import com.accessibleconnect.backend.communication.stt.provider.DatabaseSignAssetProvider;
import com.accessibleconnect.backend.communication.stt.provider.MockSignAssetProvider;
import com.accessibleconnect.backend.communication.stt.provider.SignAssetProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class SignAssetConfig {
    private static final Logger log = LoggerFactory.getLogger(SignAssetConfig.class);

    @Bean
    @Primary
    public SignAssetProvider activeSignAssetProvider(
            DatabaseSignAssetProvider databaseProvider,
            MockSignAssetProvider mockProvider,
            @Value("${app.sign-assets.provider:mock}") String providerType
    ) {
        log.info("[Sign Asset Config] Resolving active sign asset provider for type: {}", providerType);
        if ("database".equalsIgnoreCase(providerType.trim())) {
            log.info("[Sign Asset Config] DatabaseSignAssetProvider selected as active provider.");
            return databaseProvider;
        }
        log.info("[Sign Asset Config] MockSignAssetProvider selected as active provider.");
        return mockProvider;
    }
}
