const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';

// School signup
router.post('/signup', async (req, res) => {
  const { schoolName, email, password, apiKey } = req.body;
  if (!schoolName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const schoolResult = await pool.query(
      'INSERT INTO schools (name, api_key_encrypted) VALUES ($1, $2) RETURNING id',
      [schoolName, apiKey || null]
    );
    const schoolId = schoolResult.rows[0].id;
    const hash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      'INSERT INTO users (school_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
      [schoolId, email, hash, 'admin', email.split('@')[0]]
    );
    const user = userResult.rows[0];
    const token = jwt.sign({ userId: user.id, schoolId, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, schoolId, schoolName } });
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
      'SELECT u.*, s.name as school_name, s.api_key_encrypted FROM users u JOIN schools s ON u.school_id = s.id WHERE u.email = $1',
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, schoolId: user.school_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, schoolId: user.school_id, schoolName: user.school_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept invite
router.post('/invite/accept', async (req, res) => {
  const { token, email, password, name } = req.body;
  if (!token || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const invite = await pool.query('SELECT * FROM invites WHERE token = $1 AND used = FALSE', [token]);
    if (invite.rows.length === 0) return res.status(400).json({ error: 'Invalid or used invite' });
    const { school_id, role } = invite.rows[0];
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      'INSERT INTO users (school_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
      [school_id, email, hash, role, name || email.split('@')[0]]
    );
    await pool.query('UPDATE invites SET used = TRUE WHERE token = $1', [token]);
    const school = await pool.query('SELECT name FROM schools WHERE id = $1', [school_id]);
    const user = userResult.rows[0];
    const jwtToken = jwt.sign({ userId: user.id, schoolId: school_id, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, user: { ...user, schoolId: school_id, schoolName: school.rows[0].name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate invite link (admin only)
router.post('/invite/create', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'assistant') return res.status(403).json({ error: 'Forbidden' });
    const { role } = req.body;
    if (!['teacher', 'student', 'assistant'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('INSERT INTO invites (school_id, role, token) VALUES ($1, $2, $3)', [decoded.schoolId, role, token]);
    res.json({ inviteUrl: `/invite/${token}`, token });
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
      'SELECT u.id, u.email, u.role, u.name, u.school_id, s.name as school_name, s.api_key_encrypted FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name, schoolId: user.school_id, schoolName: user.school_name, hasApiKey: !!user.api_key_encrypted });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/join', async (req, res) => {
  const { code, name, email, password } = req.body;
  if (!code || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query(
      'SELECT id, name, teacher_code, student_code, assistant_code FROM schools WHERE teacher_code = $1 OR student_code = $1 OR assistant_code = $1',
      [code.toUpperCase()]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid access code' });
    const school = result.rows[0];
    let role = 'student';
    if (code.toUpperCase() === school.teacher_code) role = 'teacher';
    else if (code.toUpperCase() === school.assistant_code) role = 'assistant';
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 12);
    const userResult = await pool.query(
      'INSERT INTO users (school_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
      [school.id, email, hash, role, name || email.split('@')[0]]
    );
    const user = userResult.rows[0];
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';
    const token = jwt.sign({ userId: user.id, schoolId: school.id, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, schoolId: school.id, schoolName: school.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
