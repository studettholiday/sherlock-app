DROP TABLE IF EXISTS invites CASCADE;

CREATE TABLE invites (
  id SERIAL PRIMARY KEY,
  code UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id),
  target_role VARCHAR(20) NOT NULL CHECK (target_role IN ('assistant', 'teacher', 'student')),
  used_by INTEGER REFERENCES users(id),
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_school_id ON invites(school_id);
