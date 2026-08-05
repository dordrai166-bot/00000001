-- Run this against the LIVE database — schema.sql only runs automatically on a
-- brand-new (empty) Postgres volume, so your already-running DB needs these
-- changes applied by hand. Safe to run more than once (every statement is
-- idempotent). Nothing here drops or rewrites existing data.
--
--   docker exec -i auth-postgres psql -U authuser -d authdb < migration_001_oauth_and_prefs.sql

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_theme TEXT NOT NULL DEFAULT 'light';

CREATE TABLE IF NOT EXISTS oauth_identities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  provider_user_id  TEXT NOT NULL,
  email             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_identities_user ON oauth_identities(user_id);
