-- =========================================================================
-- ACCESSIBLE CONNECT - FLYWAY SCHEMA EVOLUTION (V7)
-- CREATES TRANSLATION SEQUENCE HISTORY PERSISTENCE LAYER
-- =========================================================================

-- Add last sequence number counter to communication sessions
ALTER TABLE communication_sessions ADD COLUMN IF NOT EXISTS last_sequence_number BIGINT DEFAULT 0;

-- Create translation sequences history table
CREATE TABLE IF NOT EXISTS translation_sequences (
    id UUID PRIMARY KEY,
    sequence_id VARCHAR(100) NOT NULL UNIQUE,
    session_id UUID NOT NULL REFERENCES communication_sessions(id) ON DELETE CASCADE,
    source_transcript_id VARCHAR(100) NOT NULL,
    sender_id VARCHAR(100) NOT NULL,
    sequence_number BIGINT NOT NULL,
    source_text TEXT,
    language VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_session_transcript UNIQUE (session_id, source_transcript_id),
    CONSTRAINT uq_session_seq_num UNIQUE (session_id, sequence_number)
);

-- Index optimizations for incremental recovery lookups
CREATE INDEX IF NOT EXISTS idx_trans_seq_session_num_sort ON translation_sequences(session_id, sequence_number);
