-- 019_student_downloads.sql
-- Per-school owner-controlled setting: whether students can download files
-- from the library. Same opt-in pattern as student_ai_enabled — default false,
-- owner enables explicitly via the three-dot menu. Idempotent — safe to re-run.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_downloads_enabled BOOLEAN NOT NULL DEFAULT false;
