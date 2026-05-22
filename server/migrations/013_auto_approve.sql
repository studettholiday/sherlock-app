-- 013_auto_approve.sql
-- Disables the school-approval gate: every school is auto-approved.
-- Backfills existing pending schools and makes 'approved' the column default.
-- Idempotent — safe to re-run.

UPDATE schools SET status = 'approved', approved_at = NOW() WHERE status = 'pending';

ALTER TABLE schools ALTER COLUMN status SET DEFAULT 'approved';
