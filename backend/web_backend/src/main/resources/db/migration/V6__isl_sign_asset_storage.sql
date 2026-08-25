-- =========================================================================
-- ACCESSIBLE CONNECT - FLYWAY SCHEMA EVOLUTION (V6)
-- ADDS STORAGE METADATA COLUMNS TO ISL SIGN ASSETS
-- =========================================================================

ALTER TABLE isl_sign_assets ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50);
ALTER TABLE isl_sign_assets ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(100);
ALTER TABLE isl_sign_assets ADD COLUMN IF NOT EXISTS storage_path VARCHAR(255);
ALTER TABLE isl_sign_assets ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE isl_sign_assets ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE isl_sign_assets ADD COLUMN IF NOT EXISTS storage_status VARCHAR(30);

-- Enforce storage path uniqueness to prevent naming collisions
CREATE UNIQUE INDEX IF NOT EXISTS idx_isl_assets_storage_path ON isl_sign_assets(storage_path);
