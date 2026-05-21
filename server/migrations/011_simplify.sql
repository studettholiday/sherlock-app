-- 011_simplify.sql
-- Radical simplification: collapse roles to teacher/student, add is_owner,
-- drop every table/column for removed features. Idempotent — safe to re-run.

-- 1. Roles -----------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false;

-- Founding admins become owner-teachers; assistants become plain teachers.
UPDATE users SET role = 'teacher', is_owner = true WHERE role = 'admin';
UPDATE users SET role = 'teacher'                  WHERE role = 'assistant';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD  CONSTRAINT users_role_check CHECK (role IN ('teacher','student'));

-- 2. Drop tables for deleted features (dependents first) -------------------
DROP TABLE IF EXISTS notifications     CASCADE;
DROP TABLE IF EXISTS absence_reports   CASCADE;
DROP TABLE IF EXISTS web_registrations CASCADE;
DROP TABLE IF EXISTS student_diary     CASCADE;
DROP TABLE IF EXISTS student_notes     CASCADE;
DROP TABLE IF EXISTS student_labels    CASCADE;
DROP TABLE IF EXISTS events            CASCADE;
DROP TABLE IF EXISTS knowledge_library CASCADE;

-- 3. Schedule: decouple from groups/subjects -> free-text class name -------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'schedule' AND column_name = 'subject') THEN
    ALTER TABLE schedule RENAME COLUMN subject TO class_name;
  END IF;
END $$;
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE schedule DROP COLUMN IF EXISTS group_id;

-- 4. Now safe to drop groups + subjects -----------------------------------
DROP TABLE IF EXISTS groups   CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- 5. schools: drop columns for removed features ---------------------------
ALTER TABLE schools DROP COLUMN IF EXISTS assistant_code;
ALTER TABLE schools DROP COLUMN IF EXISTS teacher_code;
ALTER TABLE schools DROP COLUMN IF EXISTS student_code;
ALTER TABLE schools DROP COLUMN IF EXISTS chat_mode_ceiling;

-- 6. invites: target_role limited to teacher/student ----------------------
UPDATE invites SET target_role = 'teacher' WHERE target_role = 'assistant';
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_target_role_check;
ALTER TABLE invites ADD  CONSTRAINT invites_target_role_check
  CHECK (target_role IN ('teacher','student'));
