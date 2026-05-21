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
    const sql011 = fs.readFileSync(path.join(__dirname, 'migrations/011_simplify.sql'), 'utf8');
    await pool.query(sql011);
    console.log('[startup] migration 011 complete');
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

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
