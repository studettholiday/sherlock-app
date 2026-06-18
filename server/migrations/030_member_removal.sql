-- 030_member_removal.sql
-- Owner-initiated, reversible removal of a member from their school.
-- NULL = active (the default); a non-null timestamp means the owner removed
-- this member. Distinct from deleted_at (the 21-day GDPR self-delete grace):
-- removal is an owner action, has no cleanup cron, and is undone by clearing
-- removed_at — it never hard-deletes the row.
--
-- Enforcement lives entirely in the central auth middleware (deny-by-default):
-- a removed member is 403 for every school feature, reaching only their own
-- account-deletion and logout. No per-feature checks.
--
-- Partial index because the overwhelming majority of rows stay removed_at NULL,
-- and the only reader (the roster's "active members" query) filters on the
-- small removed set — mirrors the deleted_at indexes from 022.
-- Idempotent — safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_removed_at ON users(removed_at) WHERE removed_at IS NOT NULL;
