package com.accessibleconnect.backend.isl.repository;

import com.accessibleconnect.backend.isl.entity.TranslationSequenceHistory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TranslationSequenceHistoryRepository extends JpaRepository<TranslationSequenceHistory, UUID> {
    
    Optional<TranslationSequenceHistory> findBySourceTranscriptId(String sourceTranscriptId);
    
    Optional<TranslationSequenceHistory> findBySequenceId(String sequenceId);
    
    List<TranslationSequenceHistory> findBySessionIdAndSequenceNumberGreaterThanOrderBySequenceNumberAsc(
            UUID sessionId, Long sequenceNumber
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT MAX(t.sequenceNumber) FROM TranslationSequenceHistory t WHERE t.sessionId = :sessionId")
    Optional<Long> findMaxSequenceNumberBySessionIdForUpdate(@Param("sessionId") UUID sessionId);
}
