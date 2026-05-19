CREATE TABLE IF NOT EXISTS student_labels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL,
  label_id INTEGER REFERENCES student_labels(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_diary (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL,
  label_id INTEGER REFERENCES student_labels(id) ON DELETE SET NULL,
  mood TEXT,
  practiced TEXT NOT NULL,
  goal TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
