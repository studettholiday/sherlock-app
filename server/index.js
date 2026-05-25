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
const pushRouter = require('./routes/push');

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
  try {
    const sql011 = fs.readFileSync(path.join(__dirname, 'migrations/011_simplify.sql'), 'utf8');
    await pool.query(sql011);
    console.log('[startup] migration 011 complete');
    const sql012 = fs.readFileSync(path.join(__dirname, 'migrations/012_kill_teacher.sql'), 'utf8');
    await pool.query(sql012);
    console.log('[startup] migration 012 complete');
    const sql013 = fs.readFileSync(path.join(__dirname, 'migrations/013_auto_approve.sql'), 'utf8');
    await pool.query(sql013);
    console.log('[startup] migration 013 complete');
    const sql014 = fs.readFileSync(path.join(__dirname, 'migrations/014_push_subscriptions.sql'), 'utf8');
    await pool.query(sql014);
    console.log('[startup] migration 014 complete');
    const sql015 = fs.readFileSync(path.join(__dirname, 'migrations/015_student_classes.sql'), 'utf8');
    await pool.query(sql015);
    console.log('[startup] migration 015 complete');
    const sql016 = fs.readFileSync(path.join(__dirname, 'migrations/016_library_file_classes.sql'), 'utf8');
    await pool.query(sql016);
    console.log('[startup] migration 016 complete');
    const sql017 = fs.readFileSync(path.join(__dirname, 'migrations/017_library_content_binary.sql'), 'utf8');
    await pool.query(sql017);
    console.log('[startup] migration 017 complete');
    const sql018 = fs.readFileSync(path.join(__dirname, 'migrations/018_school_settings.sql'), 'utf8');
    await pool.query(sql018);
    console.log('[startup] migration 018 complete');
    const sql019 = fs.readFileSync(path.join(__dirname, 'migrations/019_student_downloads.sql'), 'utf8');
    await pool.query(sql019);
    console.log('[startup] migration 019 complete');
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
app.use('/api/push', pushRouter);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/search', searchRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
