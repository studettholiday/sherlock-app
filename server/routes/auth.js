const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';

// School signup (standard) or invite-based signup
router.post('/signup', async (req, res) => {
  const { schoolName, email, password, apiKey, invite_code, name, directorName, phone, website } = req.body;

  if (invite_code) {
    try {
      const inviteRes = await pool.query(
        'SELECT i.*, s.name as school_name FROM invites i JOIN schools s ON i.school_id = s.id WHERE i.code = $1',
        [invite_code]
      );
      if (inviteRes.rows.length === 0) return res.status(400).json({ error: 'Invalid invite code' });
      const invite = inviteRes.rows[0];
      if (invite.used_at) return res.status(400).json({ error: 'Invite already used' });
      if (new Date(invite.expires_at) < new Date()) return res.status(400).json({ error: 'Invite expired' });
      if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
      const hash = await bcrypt.hash(password, 12);
      const userResult = await pool.query(
        'INSERT INTO users (school_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
        [invite.school_id, email, hash, invite.target_role, name || email.split('@')[0]]
      );
      const user = userResult.rows[0];
      await pool.query('UPDATE invites SET used_by = $1, used_at = NOW() WHERE code = $2', [user.id, invite_code]);
      const token = jwt.sign({ userId: user.id, schoolId: invite.school_id, role: invite.target_role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { ...user, schoolId: invite.school_id, schoolName: invite.school_name } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // Standard school registration
  if (!schoolName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const schoolResult = await pool.query(
      'INSERT INTO schools (name, api_key_encrypted, director_name, phone, website, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [schoolName, apiKey || null, directorName || null, phone || null, website || null, 'pending']
    );
    const schoolId = schoolResult.rows[0].id;
    const hash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      'INSERT INTO users (school_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
      [schoolId, email, hash, 'admin', email.split('@')[0]]
    );
    const user = userResult.rows[0];
    const token = jwt.sign({ userId: user.id, schoolId, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_ADMIN_ID;
    if (telegramToken && adminId) {
      const message = `🏫 New school registration!\n\nSchool: ${schoolName}\nEmail: ${email}\nID: ${schoolId}\n\nApprove: /approve_school_${schoolId}\nReject: /reject_school_${schoolId}`;
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: adminId, text: message })
      }).catch(console.error);
    }
    res.json({ token, user: { ...user, schoolId, schoolName, status: 'pending' }, pending: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query(
      'SELECT u.*, s.name as school_name, s.api_key_encrypted, s.status as school_status FROM users u JOIN schools s ON u.school_id = s.id WHERE u.email = $1',
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, schoolId: user.school_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, schoolId: user.school_id, schoolName: user.school_name, schoolStatus: user.school_status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const result = await pool.query(
      'SELECT u.id, u.email, u.role, u.name, u.school_id, s.name as school_name, s.api_key_encrypted, s.status as school_status FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name, schoolId: user.school_id, schoolName: user.school_name, schoolStatus: user.school_status, hasApiKey: !!user.api_key_encrypted });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
