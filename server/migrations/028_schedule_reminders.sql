-- 028_schedule_reminders.sql
-- Per-row dedupe timestamp for the lesson-reminder background loop. A schedule
-- row is reminded at most once per Tbilisi calendar day; the loop in
-- services/reminderLoop.js writes NOW() on every successful fire and skips
-- rows whose stamp is already on today's Tbilisi date.
-- Idempotent — safe to re-run.

ALTER TABLE schedule ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
