-- 016_library_file_classes.sql
-- Per-file class tags for the library. Each file can be tagged with zero or
-- more class_name values. A student sees a file if it is either untagged
-- (public to the school) or tagged with at least one class they are assigned
-- to in student_classes. Owners always see every file in their school.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS library_file_classes (
  id          SERIAL PRIMARY KEY,
  file_id     INTEGER NOT NULL REFERENCES library_files(id) ON DELETE CASCADE,
  school_id   INTEGER NOT NULL REFERENCES schools(id)       ON DELETE CASCADE,
  class_name  TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (file_id, class_name)
);

CREATE INDEX IF NOT EXISTS idx_library_file_classes_file_id   ON library_file_classes (file_id);
CREATE INDEX IF NOT EXISTS idx_library_file_classes_school_id ON library_file_classes (school_id);
