const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { Resend } = require('resend');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';
const resend = new Resend(process.env.RESEND_API_KEY);

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
      const token = jwt.sign({ userId: user.id, schoolId: invite.school_id, role: invite.target_role, is_owner: false }, JWT_SECRET, { expiresIn: '7d' });
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
      [schoolName, apiKey || null, directorName || null, phone || null, website || null, 'approved']
    );
    const schoolId = schoolResult.rows[0].id;
    const hash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      'INSERT INTO users (school_id, email, password_hash, role, name, is_owner) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, name',
      [schoolId, email, hash, 'student', email.split('@')[0], true]
    );
    const user = userResult.rows[0];
    const token = jwt.sign({ userId: user.id, schoolId, role: 'student', is_owner: true }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, schoolId, schoolName, status: 'approved' } });
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
      'SELECT u.*, u.is_owner, s.name as school_name, s.api_key_encrypted, s.status as school_status FROM users u JOIN schools s ON u.school_id = s.id WHERE u.email = $1',
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, schoolId: user.school_id, role: user.role, is_owner: user.is_owner }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, is_owner: user.is_owner, schoolId: user.school_id, schoolName: user.school_name, schoolStatus: user.school_status } });
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
      'SELECT u.id, u.email, u.role, u.name, u.is_owner, u.school_id, s.name as school_name, s.api_key_encrypted, s.status as school_status, s.student_ai_enabled FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name, is_owner: user.is_owner, schoolId: user.school_id, schoolName: user.school_name, schoolStatus: user.school_status, hasApiKey: !!user.api_key_encrypted, student_ai_enabled: user.student_ai_enabled });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always respond 200 to avoid email enumeration
    if (userRes.rows.length === 0) return res.json({ ok: true });
    const userId = userRes.rows[0].id;
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
    const resetLink = `https://app.sherlock.school/reset-password?token=${token}`;
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset your Sherlock password',
        html: `<p>You requested a password reset for your Sherlock account.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>Or copy this link: ${resetLink}</p><p>This link expires in 1 hour.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    } catch (emailErr) {
      console.error('[forgot-password] email send failed:', emailErr.message);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const { user_id, id: tokenId } = result.rows[0];
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept invite
router.post('/invite/accept', async (req, res) => {
  const { token, name, email, password } = req.body;
  if (!token || !name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const inviteRes = await pool.query(
      'SELECT i.*, s.name as school_name FROM invites i JOIN schools s ON i.school_id = s.id WHERE i.code = $1',
      [token]
    );
    if (inviteRes.rows.length === 0) return res.status(400).json({ error: 'Invalid invite token' });
    const invite = inviteRes.rows[0];
    if (invite.used_at) return res.status(400).json({ error: 'Invite already used' });
    if (new Date(invite.expires_at) < new Date()) return res.status(400).json({ error: 'Invite expired' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      'INSERT INTO users (school_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
      [invite.school_id, email, hash, invite.target_role, name]
    );
    const user = userResult.rows[0];
    await pool.query('UPDATE invites SET used_by = $1, used_at = NOW() WHERE code = $2', [user.id, token]);
    const jwtToken = jwt.sign({ userId: user.id, schoolId: invite.school_id, role: invite.target_role, is_owner: false }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token: jwtToken, user: { ...user, schoolId: invite.school_id, schoolName: invite.school_name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
