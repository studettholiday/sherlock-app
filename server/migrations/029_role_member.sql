-- 029_role_member.sql
-- Rename the sole non-owner role 'student' -> 'member'. Ownership stays
-- expressed solely by users.is_owner (owner = is_owner=true); this migration
-- never touches is_owner, so no user gains or loses any capability — only the
-- role label changes. Supersedes the role references in migrations 001/005/
-- 011/012, which are kept intact as historical record.
--
-- Re-runnable: every step is guarded (DROP CONSTRAINT IF EXISTS / IS DISTINCT
-- FROM / re-ADD after DROP), so it converges to the same end state whether the
-- DB is still fully in the old state OR was left half-converted by an earlier
-- failed run. Ordering matters: in each block the old CHECK is dropped BEFORE
-- the UPDATE, because the live constraint (from 012) only permits the old value
-- and would reject the new 'member' value if the UPDATE ran first.

-- 1. Users: collapse every non-owner role label to 'member'.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role = 'member' WHERE role IS DISTINCT FROM 'member';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE users ADD  CONSTRAINT users_role_check CHECK (role IN ('member'));

-- 2. Invites: target_role becomes 'member'. Drop the old CHECK *first* — the
--    live constraint (012) permits only 'student', so updating to 'member'
--    before dropping it violates the constraint (the bug that crashed boot).
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_target_role_check;
UPDATE invites SET target_role = 'member' WHERE target_role IS DISTINCT FROM 'member';
ALTER TABLE invites ADD  CONSTRAINT invites_target_role_check CHECK (target_role IN ('member'));
