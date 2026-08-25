-- =========================================================================
-- ACCESSIBLE CONNECT - FLYWAY SCHEMA EVOLUTION (V5)
-- CREATES ISL SIGN ASSETS PERSISTENCE LAYER
-- =========================================================================

CREATE TABLE IF NOT EXISTS isl_sign_assets (
    id UUID PRIMARY KEY,
    concept_id VARCHAR(100) NOT NULL,
    display_token VARCHAR(100) NOT NULL,
    language VARCHAR(30) NOT NULL,
    asset_type VARCHAR(30) NOT NULL,
    asset_reference VARCHAR(255),
    duration_ms INTEGER NOT NULL,
    quality VARCHAR(30),
    version_major INTEGER NOT NULL,
    version_minor INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    verification_status VARCHAR(30) NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT unique_concept_lang_version UNIQUE (concept_id, language, version_major, version_minor)
);

-- Search and lookup index optimizations
CREATE INDEX IF NOT EXISTS idx_isl_assets_concept ON isl_sign_assets(concept_id);
CREATE INDEX IF NOT EXISTS idx_isl_assets_lang ON isl_sign_assets(language);
CREATE INDEX IF NOT EXISTS idx_isl_assets_status ON isl_sign_assets(status);
CREATE INDEX IF NOT EXISTS idx_isl_assets_verification ON isl_sign_assets(verification_status);

-- Seed initial catalog entries under IN_REVIEW status
INSERT INTO isl_sign_assets (id, concept_id, display_token, language, asset_type, asset_reference, duration_ms, quality, version_major, version_minor, status, verification_status, source, created_at, updated_at) VALUES
('b0e0a0e0-b0e0-b0e0-b0e0-b0e0a0e0b0e0', 'HELLO', 'HELLO', 'ISL', 'VIDEO', '/assets/isl/hello.mp4', 1500, 'HD', 1, 0, 'IN_REVIEW', 'IN_REVIEW', 'catalog_seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b0e0a0e0-b0e0-b0e0-b0e0-b0e0a0e0b0e1', 'TOMORROW', 'TOMORROW', 'ISL', 'VIDEO', '/assets/isl/tomorrow.mp4', 1200, 'HD', 1, 0, 'IN_REVIEW', 'IN_REVIEW', 'catalog_seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b0e0a0e0-b0e0-b0e0-b0e0-b0e0a0e0b0e2', 'OFFICE', 'OFFICE', 'ISL', 'VIDEO', '/assets/isl/office.mp4', 1700, 'HD', 1, 0, 'IN_REVIEW', 'IN_REVIEW', 'catalog_seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b0e0a0e0-b0e0-b0e0-b0e0-b0e0a0e0b0e3', 'GO', 'GO', 'ISL', 'VIDEO', '/assets/isl/go.mp4', 1000, 'HD', 1, 0, 'IN_REVIEW', 'IN_REVIEW', 'catalog_seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b0e0a0e0-b0e0-b0e0-b0e0-b0e0a0e0b0e4', 'NOT', 'NOT', 'ISL', 'VIDEO', '/assets/isl/not.mp4', 800, 'HD', 1, 0, 'IN_REVIEW', 'IN_REVIEW', 'catalog_seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b0e0a0e0-b0e0-b0e0-b0e0-b0e0a0e0b0e5', 'QUESTION', 'QUESTION', 'ISL', 'VIDEO', '/assets/isl/question.mp4', 900, 'HD', 1, 0, 'IN_REVIEW', 'IN_REVIEW', 'catalog_seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
