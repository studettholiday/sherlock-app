const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Get school codes
router.get('/codes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT teacher_code, student_code, assistant_code, status FROM schools WHERE id = $1',
      [req.user.schoolId]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate a code for a role
router.post('/codes/generate', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { role } = req.body;
  if (!['teacher', 'student', 'assistant'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const schoolResult = await pool.query('SELECT status FROM schools WHERE id = $1', [req.user.schoolId]);
  if (schoolResult.rows[0]?.status !== 'approved') {
    return res.status(403).json({ error: 'School not yet approved. Please wait for admin approval.' });
  }
  const prefixes = { teacher: 'TCH', student: 'STD', assistant: 'AST' };
  const code = generateCode(prefixes[role]);
  try {
    await pool.query(
      `UPDATE schools SET ${role}_code = $1 WHERE id = $2`,
      [code, req.user.schoolId]
    );
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get school settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT chat_mode_ceiling FROM schools WHERE id = $1',
      [req.user.schoolId]
    );
    res.json(result.rows[0] || { chat_mode_ceiling: 'full' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update school settings
router.patch('/settings', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { chat_mode_ceiling } = req.body;
  if (!['focus', 'smart', 'full'].includes(chat_mode_ceiling)) {
    return res.status(400).json({ error: 'Invalid chat_mode_ceiling value' });
  }
  try {
    await pool.query(
      'UPDATE schools SET chat_mode_ceiling = $1 WHERE id = $2',
      [chat_mode_ceiling, req.user.schoolId]
    );
    res.json({ chat_mode_ceiling });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get school members
router.get('/members', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE school_id = $1 ORDER BY created_at ASC',
      [req.user.schoolId]
    );
    res.json({ members: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a school member (admin only)
router.delete('/members/:userId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { userId } = req.params;
  if (parseInt(userId) === req.user.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  try {
    await pool.query(
      'DELETE FROM users WHERE id = $1 AND school_id = $2',
      [userId, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
