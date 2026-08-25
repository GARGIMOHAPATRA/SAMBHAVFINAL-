package com.accessibleconnect.backend.communication.repository;

import com.accessibleconnect.backend.communication.entity.CommunicationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunicationSessionRepository extends JpaRepository<CommunicationSession, UUID> {
    Optional<CommunicationSession> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
    List<CommunicationSession> findByCreatorEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM CommunicationSession s WHERE s.id = :id")
    Optional<CommunicationSession> findByIdForUpdate(@Param("id") UUID id);
}
