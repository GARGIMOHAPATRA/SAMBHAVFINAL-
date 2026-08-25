package com.accessibleconnect.backend.communication.stt.service;

import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.entity.CommunicationSessionStatus;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.communication.stt.dto.SignSequence;
import com.accessibleconnect.backend.communication.stt.dto.TranscriptEvent;
import com.accessibleconnect.backend.isl.entity.TranslationSequenceHistory;
import com.accessibleconnect.backend.isl.repository.TranslationSequenceHistoryRepository;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class TranslationPipelineConcurrencyTest {

    @Autowired
    private TranslationPipelineService pipelineService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private TranslationSequenceHistoryRepository historyRepository;

    @Test
    public void testConcurrentTranslationSequenceNumbering() throws Exception {
        // Setup user and session
        User creator = new User();
        creator.setEmail("concurrency-test-" + UUID.randomUUID() + "@test.com");
        creator.setPasswordHash("pwd");
        creator.setName("Concurrency Tester");
        creator.setAccountType(com.accessibleconnect.backend.user.entity.AccountType.COMMON_USER);
        userRepository.save(creator);

        CommunicationSession session = new CommunicationSession();
        session.setCreator(creator);
        session.setMode(CommunicationMode.ONLINE);
        session.setStatus(CommunicationSessionStatus.ACTIVE);
        session.setLastSequenceNumber(0L);
        sessionRepository.save(session);

        UUID sessionId = session.getId();
        int concurrencyLevel = 10;
        ExecutorService executor = Executors.newFixedThreadPool(concurrencyLevel);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<SignSequence>> futures = new ArrayList<>();

        for (int i = 1; i <= concurrencyLevel; i++) {
            final int index = i;
            futures.add(executor.submit(() -> {
                latch.await(); // wait for start signal to run concurrently
                TranscriptEvent event = new TranscriptEvent(
                        "evt-" + index,
                        sessionId.toString(),
                        "user-1",
                        "User",
                        "COMMON_USER",
                        "hello " + index,
                        true,
                        System.currentTimeMillis(),
                        0.99
                );
                return pipelineService.translateTranscript(sessionId.toString(), event);
            }));
        }

        latch.countDown(); // trigger all threads concurrently
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.SECONDS);

        // Verify results
        List<TranslationSequenceHistory> historyList = historyRepository
                .findBySessionIdAndSequenceNumberGreaterThanOrderBySequenceNumberAsc(sessionId, 0L);

        assertEquals(concurrencyLevel, historyList.size());
        
        // Assert sequence numbers are consecutive integers from 1 to 10
        for (int i = 0; i < concurrencyLevel; i++) {
            long expectedSeqNum = i + 1L;
            assertEquals(expectedSeqNum, historyList.get(i).getSequenceNumber().longValue());
            assertNotNull(historyList.get(i).getSequenceId());
        }

        // Verify session counter is updated to 10
        CommunicationSession finalSession = sessionRepository.findById(sessionId).orElseThrow();
        assertEquals(concurrencyLevel, finalSession.getLastSequenceNumber().longValue());
    }
}
