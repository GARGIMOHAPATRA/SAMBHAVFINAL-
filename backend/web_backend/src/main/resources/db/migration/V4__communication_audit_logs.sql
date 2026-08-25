-- =========================================================================
-- ACCESSIBLE CONNECT - FLYWAY SCHEMA EVOLUTION (V4)
-- CREATES COMMUNICATION AUDIT LOGS PERSISTENCE LAYER
-- =========================================================================

CREATE TABLE IF NOT EXISTS communication_audit_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    actor VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    session_id UUID,
    status VARCHAR(50) NOT NULL,
    metadata VARCHAR(2000),
    ip_address VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON communication_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON communication_audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON communication_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON communication_audit_logs(session_id);
