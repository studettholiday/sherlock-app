-- 022_soft_delete.sql
-- GDPR Stage 1: 21-day soft-delete grace period for owners (schools) and
-- students (users). NULL = active. Set on self-delete; cleared on recovery;
-- hard-deleted by the cleanup script after 21 days.
--
-- Partial indexes because the vast majority of rows will have deleted_at NULL —
-- the cleanup job and the per-request "is this user/school deleted?" check
-- both only care about the small set with a non-null value.
-- Idempotent — safe to re-run.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_schools_deleted_at ON schools(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at   ON users(deleted_at)   WHERE deleted_at IS NOT NULL;
