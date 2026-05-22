-- 015_student_classes.sql
-- Per-student class assignments. Which schedule classes a student is enrolled
-- in. The set of valid class_name values is derived from the schedule table —
-- there is no separate "classes" table. Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS student_classes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_name  TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, class_name)
);

-- Student-side: "what classes is this student in" (filtered schedule).
CREATE INDEX IF NOT EXISTS idx_student_classes_user_id   ON student_classes (user_id);
-- Owner-side: "all assignments in this school" (Students panel, push targeting).
CREATE INDEX IF NOT EXISTS idx_student_classes_school_id ON student_classes (school_id);
