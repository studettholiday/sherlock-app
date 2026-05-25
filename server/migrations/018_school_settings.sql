-- 018_school_settings.sql
-- Per-school owner-controlled settings. First setting: whether students can
-- use the AI chat at all. Default false — existing schools start with student
-- AI disabled until the owner explicitly enables it via the three-dot menu in
-- the chat header. Idempotent — safe to re-run.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_ai_enabled BOOLEAN NOT NULL DEFAULT false;
