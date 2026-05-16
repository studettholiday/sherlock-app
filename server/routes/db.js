const express = require('express');
const router = express.Router();
const pool = require('../services/db');

// Run migrations on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS knowledge_library (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
  )
`).then(() =>
  pool.query(`ALTER TABLE knowledge_library ADD COLUMN IF NOT EXISTS uploaded_by TEXT DEFAULT 'admin'`)
).catch(err => console.error('Library migration failed:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    school_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Waitlist migration failed:', err.message));

router.post('/waitlist', async (req, res) => {
  const { email, schoolName, schoolType } = req.body ?? {};
  if (!email || !schoolName || !schoolType) {
    return res.status(400).json({ error: 'email, schoolName, and schoolType are required' });
  }
  try {
    await pool.query(
      'INSERT INTO waitlist (email, school_name, school_type) VALUES ($1, $2, $3)',
      [email, schoolName, schoolType]
    );

    const axios = require('axios');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_ADMIN_ID;
    if (botToken && adminId) {
      const message = `🎉 New Waitlist Signup!\n\n📧 Email: ${email}\n🏫 Organization: ${schoolName}\n🏷️ Industry: ${schoolType}\n⏰ Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Tbilisi' })}`;
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: adminId,
        text: message
      }).catch(err => console.error('Telegram notification error:', err.message));
    }

    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'duplicate' });
    }
    console.error('Waitlist insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/library', async (req, res) => {
  console.log('[library POST] body:', JSON.stringify({ filename: req.body?.filename, uploaded_by: req.body?.uploaded_by, contentLength: req.body?.content?.length ?? 0 }));
  const { filename, content, uploaded_by = 'admin' } = req.body;
  if (!filename || !content) {
    console.log('[library POST] missing filename or content');
    return res.status(400).json({ error: 'filename and content are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO knowledge_library (filename, content, uploaded_by) VALUES ($1, $2, $3) RETURNING id, filename, uploaded_at, uploaded_by',
      [filename, content, uploaded_by]
    );
    console.log('[library POST] inserted id:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[library POST] insert error:', err.message, err.code, err.detail ?? '');
    res.status(500).json({ error: err.message });
  }
});

router.get('/library', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, filename, uploaded_at, uploaded_by, LEFT(content, 200) AS preview
       FROM knowledge_library
       ORDER BY uploaded_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Library fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/library/:id', async (req, res) => {
  const { uploaded_by } = req.body ?? {};
  try {
    const result = await pool.query(
      'DELETE FROM knowledge_library WHERE id = $1 AND uploaded_by = $2 RETURNING id',
      [req.params.id, uploaded_by]
    );
    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Not authorised to delete this file' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Library delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
