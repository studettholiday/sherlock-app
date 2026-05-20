require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const chatRouter = require('./routes/chat');
const dbRouter = require('./routes/db');
const youtubeRoutes = require('./routes/youtube');
const searchRoutes = require('./routes/search');
const authRouter = require('./routes/auth');
const libraryRouter = require('./routes/library');
const schoolRouter = require('./routes/school');
const invitesRouter = require('./routes/invites');

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
  try {
    const sql010 = fs.readFileSync(path.join(__dirname, 'migrations/010_notes_labels_diary.sql'), 'utf8');
    await pool.query(sql010);
    console.log('[startup] migration 010 complete');
    await pool.query(`
      ALTER TABLE student_notes ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE student_diary ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
    console.log('[startup] migration 011 complete');
    await pool.query(`
      ALTER TABLE student_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
      ALTER TABLE student_diary ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);
    console.log('[startup] migration 012 complete');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_id INT REFERENCES users(id),
        school_id INT REFERENCES schools(id),
        type VARCHAR(50),
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[startup] migration 013 complete');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS absence_reports (
        id SERIAL PRIMARY KEY,
        school_id INT REFERENCES schools(id),
        student_id INT REFERENCES users(id),
        type VARCHAR(20) NOT NULL,
        group_id INT REFERENCES groups(id),
        lesson_day VARCHAR(20),
        event_id INT REFERENCES events(id),
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[startup] migration 014 complete');
  } catch (e) {
    console.error('[startup] migration error:', e.message);
  } finally {
    await pool.end();
  }
}
runMigrations();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '26mb' }));
app.use(express.urlencoded({ limit: '26mb', extended: true }));

app.use('/api/chat', chatRouter);
app.use('/api', dbRouter);
app.use('/api/auth', authRouter);
app.use('/api/library', libraryRouter);
app.use('/api/school', schoolRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/search', searchRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/debug/library-auth', async (req, res) => {
  const jwt = require('jsonwebtoken');
  const { Pool } = require('pg');
  const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  let decoded;
  try { decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET); }
  catch (e) { return res.status(401).json({ error: 'Invalid token', detail: e.message }); }
  const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
  try {
    const r1 = await pool.query('SELECT COUNT(*) as cnt FROM library_files');
    const r2 = await pool.query('SELECT COUNT(*) as cnt FROM library_files WHERE school_id = $1', [decoded.schoolId]);
    const r3 = await pool.query('SELECT DISTINCT school_id, COUNT(*) as cnt FROM library_files GROUP BY school_id');
    res.json({ token_school_id: decoded.schoolId, token_user_id: decoded.userId, token_role: decoded.role, total_rows: r1.rows[0].cnt, rows_for_my_school: r2.rows[0].cnt, school_id_distribution: r3.rows });
  } catch (e) { res.json({ error: e.message }); }
  finally { await pool.end(); }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
