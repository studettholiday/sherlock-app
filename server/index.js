// Global crash safety: any uncaught exception or unhandled promise rejection
// logs a full stack trace and exits with code 1 so Railway restarts the
// container instead of leaving it in a half-broken state.
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException:', err.stack || err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection:', reason?.stack || reason);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const chatRouter = require('./routes/chat');
const dbRouter = require('./routes/db');
const authRouter = require('./routes/auth');
const libraryRouter = require('./routes/library');
const schoolRouter = require('./routes/school');
const invitesRouter = require('./routes/invites');
const pushRouter = require('./routes/push');

const MIGRATIONS = [
  '001_auth_and_library.sql',
  '002_school_codes.sql',
  '003_school_status.sql',
  '005_invites.sql',
  '006_chat_mode.sql',
  '007_library_content.sql',
  '008_groups_schedule_events.sql',
  '011_simplify.sql',
  '012_kill_teacher.sql',
  '013_auto_approve.sql',
  '014_push_subscriptions.sql',
  '015_student_classes.sql',
  '016_library_file_classes.sql',
  '017_library_content_binary.sql',
  '018_school_settings.sql',
  '019_student_downloads.sql',
  '020_public_library.sql',
  '021_fix_fk_cascades.sql',
  '022_soft_delete.sql',
  '023_email_verification.sql',
  '024_consent_capture.sql',
];

async function tableExists(pool, name) {
  const r = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [name]
  );
  return r.rows[0].exists;
}

// Runs every unapplied migration in MIGRATIONS order and records each in
// schema_migrations on success. Three boot scenarios:
//   - Fresh DB: tracker doesn't exist + no users table → run all top to bottom.
//   - Existing prod DB (first boot with this code): tracker doesn't exist but
//     users does → backfill tracker without running any SQL, so 005's
//     destructive DROP doesn't wipe live invites.
//   - Steady state: tracker exists → run only what's missing (normally zero).
// Errors propagate; the caller decides whether to crash the process.
async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
  try {
    const trackerExisted = await tableExists(pool, 'schema_migrations');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    if (!trackerExisted && await tableExists(pool, 'users')) {
      console.log('[startup] existing DB detected — backfilling schema_migrations');
      for (const name of MIGRATIONS) {
        await pool.query(
          'INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT DO NOTHING',
          [name]
        );
      }
      return;
    }

    const applied = await pool.query('SELECT name FROM schema_migrations');
    const appliedSet = new Set(applied.rows.map(r => r.name));

    for (const name of MIGRATIONS) {
      if (appliedSet.has(name)) continue;
      const sql = fs.readFileSync(path.join(__dirname, 'migrations', name), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
      console.log(`[startup] migration ${name} applied`);
    }
  } finally {
    await pool.end();
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

app.use('/api/chat', chatRouter);
app.use('/api', dbRouter);
app.use('/api/auth', authRouter);
app.use('/api/library', libraryRouter);
app.use('/api/school', schoolRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/push', pushRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Extensionless URLs for the legal pages. Must come before the static handler
// so they aren't shadowed by the SPA fallback below.
app.get('/privacy', (_req, res) => res.sendFile(path.join(__dirname, 'public/privacy.html')));
app.get('/terms',   (_req, res) => res.sendFile(path.join(__dirname, 'public/terms.html')));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

(async () => {
  try {
    await runMigrations();
  } catch (err) {
    console.error('[startup] FATAL migration error:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
