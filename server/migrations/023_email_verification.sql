ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Backfill pre-existing users so the migration doesn't lock anyone out.
-- Idempotent: new signups always write a token, so they don't match this filter.
UPDATE users SET email_verified = true
  WHERE email_verified = false AND verification_token IS NULL;
