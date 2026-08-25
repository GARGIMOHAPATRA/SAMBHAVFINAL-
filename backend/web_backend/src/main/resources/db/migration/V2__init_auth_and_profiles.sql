-- =========================================================================
-- ACCESSIBLE CONNECT - FLYWAY SCHEMA INITIALIZATION (V1)
-- NON-DESTRUCTIVE EVOLUTION OF EXISTING USER SCHEMA
-- =========================================================================

-- 1. Create users table if it does not exist (e.g. in clean H2 tests)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 2. Evolve existing users table columns to match JPA entity types (e.g. in Supabase)
-- Cast ID column from TEXT to UUID (Safe since the table is empty)
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;

-- Add missing columns with correct constraints if they do not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- 3. Set NOT NULL rules for newly added authentication fields
UPDATE users SET enabled = TRUE WHERE enabled IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE users ALTER COLUMN account_type SET NOT NULL;
ALTER TABLE users ALTER COLUMN enabled SET NOT NULL;

-- 4. Cast created_at from timestamptz to timestamp and enforce NOT NULL
ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP;
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;

-- 5. Create Phase 2 supporting tables if not exists
CREATE TABLE IF NOT EXISTS accessibility_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(50),
    preferred_sign_language VARCHAR(50),
    text_size_preference VARCHAR(20),
    high_contrast_preference BOOLEAN DEFAULT FALSE,
    communication_preference VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_accessibility_needs (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES accessibility_profiles(id) ON DELETE CASCADE,
    need_type VARCHAR(50) NOT NULL,
    CONSTRAINT uq_profile_need UNIQUE (profile_id, need_type)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    family_id UUID NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

-- 6. Add search indexing optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_profile_accessibility_needs_profile ON profile_accessibility_needs(profile_id);
