-- 029_role_member.sql
-- Rename the sole non-owner role 'student' -> 'member'. Ownership stays
-- expressed solely by users.is_owner (owner = is_owner=true); this migration
-- never touches is_owner, so no user gains or loses any capability — only the
-- role label changes. Idempotent and defensive (IS DISTINCT FROM also catches
-- any stray legacy/NULL role values). Supersedes the role references in
-- migrations 001/005/011/012, which are kept intact as historical record.

-- 1. Users: collapse every non-owner role label to 'member'.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role = 'member' WHERE role IS DISTINCT FROM 'member';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE users ADD  CONSTRAINT users_role_check CHECK (role IN ('member'));

-- 2. Invites: target_role becomes 'member'.
UPDATE invites SET target_role = 'member' WHERE target_role IS DISTINCT FROM 'member';
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_target_role_check;
ALTER TABLE invites ADD  CONSTRAINT invites_target_role_check CHECK (target_role IN ('member'));
