-- 020_public_library.sql
-- Adds an is_public_library flag to schools so we can host one or more
-- curated, cross-tenant libraries alongside per-school private libraries.
-- Partial index since only a tiny minority of rows will carry the flag.
-- Idempotent — safe to re-run.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_public_library BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_schools_public_library ON schools(is_public_library) WHERE is_public_library = true;
