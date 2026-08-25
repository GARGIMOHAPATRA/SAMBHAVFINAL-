package com.accessibleconnect.backend.isl.repository;

import com.accessibleconnect.backend.communication.entity.CommunicationMode;
import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import com.accessibleconnect.backend.communication.entity.CommunicationSessionStatus;
import com.accessibleconnect.backend.communication.repository.CommunicationSessionRepository;
import com.accessibleconnect.backend.isl.entity.TranslationSequenceHistory;
import com.accessibleconnect.backend.user.entity.User;
import com.accessibleconnect.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class TranslationSequenceHistoryRepositoryTest {

    @Autowired
    private TranslationSequenceHistoryRepository historyRepository;

    @Autowired
    private CommunicationSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testPersistAndRetrieveHistory() {
        User creator = new User();
        creator.setEmail("creator-" + UUID.randomUUID() + "@test.com");
        creator.setPasswordHash("pwd");
        creator.setName("Creator");
        creator.setAccountType(com.accessibleconnect.backend.user.entity.AccountType.COMMON_USER);
        userRepository.save(creator);

        CommunicationSession session = new CommunicationSession();
        session.setCreator(creator);
        session.setMode(CommunicationMode.ONLINE);
        session.setStatus(CommunicationSessionStatus.ACTIVE);
        sessionRepository.save(session);

        TranslationSequenceHistory history = new TranslationSequenceHistory(
                UUID.randomUUID(),
                "seq-1",
                session.getId(),
                "transcript-1",
                "sender-1",
                1L,
                "Hello",
                "ISL",
                System.currentTimeMillis(),
                "{}"
        );
        historyRepository.save(history);

        List<TranslationSequenceHistory> fetched = historyRepository
                .findBySessionIdAndSequenceNumberGreaterThanOrderBySequenceNumberAsc(session.getId(), 0L);

        assertEquals(1, fetched.size());
        assertEquals("seq-1", fetched.get(0).getSequenceId());
        assertEquals("transcript-1", fetched.get(0).getSourceTranscriptId());
    }

    @Test
    public void testUniqueConstraintsEnforced() {
        User creator = new User();
        creator.setEmail("creator-" + UUID.randomUUID() + "@test.com");
        creator.setPasswordHash("pwd");
        creator.setName("Creator");
        creator.setAccountType(com.accessibleconnect.backend.user.entity.AccountType.COMMON_USER);
        userRepository.save(creator);

        CommunicationSession session = new CommunicationSession();
        session.setCreator(creator);
        session.setMode(CommunicationMode.ONLINE);
        session.setStatus(CommunicationSessionStatus.ACTIVE);
        sessionRepository.save(session);

        TranslationSequenceHistory h1 = new TranslationSequenceHistory(
                UUID.randomUUID(),
                "seq-1",
                session.getId(),
                "transcript-1",
                "sender-1",
                1L,
                "Hello",
                "ISL",
                System.currentTimeMillis(),
                "{}"
        );
        historyRepository.saveAndFlush(h1);

        // Attempting to insert duplicate source_transcript_id under same session should violate unique constraint
        TranslationSequenceHistory h2 = new TranslationSequenceHistory(
                UUID.randomUUID(),
                "seq-2",
                session.getId(),
                "transcript-1",
                "sender-2",
                2L,
                "Hello Again",
                "ISL",
                System.currentTimeMillis(),
                "{}"
        );

        assertThrows(DataIntegrityViolationException.class, () -> {
            historyRepository.saveAndFlush(h2);
        });
    }

    @Test
    public void testIncrementalRecoveryQueries() {
        User creator = new User();
        creator.setEmail("creator-" + UUID.randomUUID() + "@test.com");
        creator.setPasswordHash("pwd");
        creator.setName("Creator");
        creator.setAccountType(com.accessibleconnect.backend.user.entity.AccountType.COMMON_USER);
        userRepository.save(creator);

        CommunicationSession session = new CommunicationSession();
        session.setCreator(creator);
        session.setMode(CommunicationMode.ONLINE);
        session.setStatus(CommunicationSessionStatus.ACTIVE);
        sessionRepository.save(session);

        for (int i = 1; i <= 5; i++) {
            TranslationSequenceHistory h = new TranslationSequenceHistory(
                    UUID.randomUUID(),
                    "seq-" + i,
                    session.getId(),
                    "transcript-" + i,
                    "sender-1",
                    (long) i,
                    "Text " + i,
                    "ISL",
                    System.currentTimeMillis(),
                    "{}"
            );
            historyRepository.save(h);
        }
        historyRepository.flush();

        List<TranslationSequenceHistory> recovery = historyRepository
                .findBySessionIdAndSequenceNumberGreaterThanOrderBySequenceNumberAsc(session.getId(), 2L);

        assertEquals(3, recovery.size());
        assertEquals(3L, recovery.get(0).getSequenceNumber());
        assertEquals(5L, recovery.get(2).getSequenceNumber());
    }
}
