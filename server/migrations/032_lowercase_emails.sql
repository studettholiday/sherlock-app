-- 032: Make email handling case-insensitive — backfill existing rows to the
-- lowercased form so "Foo@x.com" and "foo@x.com" can't be two accounts.
--
-- The application now lowercases every email at entry (normalizeEmail in
-- routes/auth.js); this aligns pre-existing data with that invariant.
--
-- SAFETY: the existing UNIQUE(email) constraint stays in place. If any
-- case-collision existed (e.g. both "Foo@x.com" and "foo@x.com"), this UPDATE
-- would fail loudly on the unique violation rather than silently merging two
-- accounts. Verified beforehand that no such collisions exist, so it just
-- succeeds. Idempotent — re-running is a no-op once all emails are lowercase.

UPDATE users SET email = lower(email) WHERE email <> lower(email);
