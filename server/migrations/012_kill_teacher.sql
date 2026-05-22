-- 012_kill_teacher.sql
-- Removes the 'teacher' role. Final model: every user has role='student';
-- ownership is expressed solely by users.is_owner (owner = is_owner=true).
-- Idempotent — safe to re-run. Supersedes the 'teacher' references in
-- migrations 002/005/011, which are kept intact as historical record.

-- 1. Collapse all teachers (owners and non-owners) to role='student'.
--    is_owner is untouched, so existing owners stay owners.
UPDATE users SET role = 'student' WHERE role = 'teacher';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD  CONSTRAINT users_role_check CHECK (role IN ('student'));

-- 2. Convert any teacher-targeted invites to student invites.
UPDATE invites SET target_role = 'student' WHERE target_role = 'teacher';

ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_target_role_check;
ALTER TABLE invites ADD  CONSTRAINT invites_target_role_check CHECK (target_role IN ('student'));
