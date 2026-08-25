-- =========================================================================
-- ACCESSIBLE CONNECT - FLYWAY SCHEMA EVOLUTION (V3)
-- CREATES COMMUNICATION SESSIONS PERSISTENCE LAYER
-- =========================================================================

CREATE TABLE IF NOT EXISTS communication_sessions (
    id UUID PRIMARY KEY,
    creator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    room_code VARCHAR(100) UNIQUE,
    created_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
);

-- Search and lookup index optimizations
CREATE INDEX IF NOT EXISTS idx_comm_sessions_creator ON communication_sessions(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_comm_sessions_room_code ON communication_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_comm_sessions_status ON communication_sessions(status);
CREATE INDEX IF NOT EXISTS idx_comm_sessions_created_at ON communication_sessions(created_at);
