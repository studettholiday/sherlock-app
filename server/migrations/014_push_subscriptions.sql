-- 014_push_subscriptions.sql
-- Web Push (VAPID) subscriptions: one row per browser/device push subscription.
-- Used to broadcast schedule-change notifications to every active user in a school.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Fast lookup of all subscriptions for a school at broadcast time.
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_school_id
  ON push_subscriptions (school_id);
