package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.stt.dto.*;
import com.accessibleconnect.backend.communication.stt.provider.DatabaseSignAssetProvider;
import com.accessibleconnect.backend.isl.entity.ISLSignAsset;
import com.accessibleconnect.backend.isl.repository.ISLSignAssetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class SignSequenceServiceIntegrationTest {

    @Autowired
    private ISLSignAssetRepository repository;

    @Autowired
    private DatabaseSignAssetProvider databaseProvider;

    @Test
    public void testEndToEndPipelineWithDatabaseProvider() {
        // Prepare database active asset
        ISLSignAsset asset = new ISLSignAsset(
                UUID.randomUUID(), "HELLO_TEST", "HELLO_TEST", "ISL", "VIDEO", "/assets/hello.mp4", 1500, "HD", 1, 0,
                AssetStatus.ACTIVE, VerificationStatus.VERIFIED, "integration_test"
        );
        repository.save(asset);

        // Instantiate sequence service using the DB provider
        SignSequenceService service = new SignSequenceServiceImpl(databaseProvider, 1000);

        ISLRepresentation representation = new ISLRepresentation(
                "rep-123",
                "Hello",
                "en",
                "greeting",
                List.of(
                        new ISLToken("HELLO_TEST", "HELLO_TEST", ISLTokenCategory.GREETING, "greet", 0.99, 1)
                ),
                Map.of(),
                0.99,
                System.currentTimeMillis()
        );

        SignSequence sequence = service.generateSequence("session-123", representation);

        assertNotNull(sequence);
        assertEquals(1, sequence.getSteps().size());
        SignStep step = sequence.getSteps().get(0);
        assertEquals("HELLO_TEST", step.getConceptId());
        assertEquals(AssetResolutionStatus.FOUND, step.getResolutionStatus());
        assertNotNull(step.getAsset());
        assertEquals("1.0", step.getAsset().getVersion());
        assertEquals("/assets/hello.mp4", step.getAsset().getAssetReference());
    }
}
