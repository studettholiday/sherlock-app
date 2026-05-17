require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./routes/chat');
const dbRouter = require('./routes/db');
const youtubeRoutes = require('./routes/youtube');
const searchRoutes = require('./routes/search');
const authRouter = require('./routes/auth');
const libraryRouter = require('./routes/library');
const schoolRouter = require('./routes/school');
const invitesRouter = require('./routes/invites');

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

app.get('/api/debug/db', async (req, res) => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
  try {
    const r1 = await pool.query('SELECT COUNT(*) FROM library_files');
    const r2 = await pool.query('SELECT current_database(), current_user, inet_server_addr()');
    const r3 = await pool.query('SELECT LEFT(current_setting(\'data_directory\'), 50) as datadir');
    res.json({ count: r1.rows[0], db: r2.rows[0], env_url_prefix: (process.env.DATABASE_PUBLIC_URL || '').slice(0, 40) });
  } catch(e) { res.json({ error: e.message }); }
  finally { await pool.end(); }
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// TEMP DEBUG - remove after fix
