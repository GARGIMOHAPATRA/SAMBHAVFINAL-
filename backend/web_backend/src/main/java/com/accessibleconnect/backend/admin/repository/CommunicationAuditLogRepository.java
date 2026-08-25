package com.accessibleconnect.backend.admin.repository;

import com.accessibleconnect.backend.admin.entity.CommunicationAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommunicationAuditLogRepository extends JpaRepository<CommunicationAuditLog, UUID> {
    Page<CommunicationAuditLog> findByActorContainingIgnoreCase(String actor, Pageable pageable);
    Page<CommunicationAuditLog> findByEventTypeContainingIgnoreCase(String eventType, Pageable pageable);
    Page<CommunicationAuditLog> findByActorContainingIgnoreCaseAndEventTypeContainingIgnoreCase(String actor, String eventType, Pageable pageable);
}
