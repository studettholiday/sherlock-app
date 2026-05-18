const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const getPool = () => new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Get school codes
router.get('/codes', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
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
  const schoolResult = await getPool().query('SELECT status FROM schools WHERE id = $1', [req.user.schoolId]);
  if (schoolResult.rows[0]?.status !== 'approved') {
    return res.status(403).json({ error: 'School not yet approved. Please wait for admin approval.' });
  }
  const prefixes = { teacher: 'TCH', student: 'STD', assistant: 'AST' };
  const code = generateCode(prefixes[role]);
  try {
    await getPool().query(
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
    const result = await getPool().query(
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
    await getPool().query(
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
    const result = await getPool().query(
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
    await getPool().query(
      'DELETE FROM users WHERE id = $1 AND school_id = $2',
      [userId, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[school] DELETE member error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Groups ---

router.get('/groups', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT * FROM groups WHERE school_id = $1 ORDER BY name ASC',
      [req.user.schoolId]
    );
    res.json({ groups: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/groups', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, instrument } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await getPool().query(
      'INSERT INTO groups (school_id, name, instrument) VALUES ($1, $2, $3) RETURNING *',
      [req.user.schoolId, name, instrument || null]
    );
    res.json({ group: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/groups/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    await getPool().query(
      'DELETE FROM groups WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Schedule ---

router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT s.*, g.name AS group_name
       FROM schedule s
       LEFT JOIN groups g ON s.group_id = g.id
       WHERE s.school_id = $1
       ORDER BY s.day_of_week, s.lesson_time`,
      [req.user.schoolId]
    );
    res.json({ schedule: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/schedule', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { group_id, day_of_week, lesson_time, subject, room } = req.body;
  try {
    const result = await getPool().query(
      'INSERT INTO schedule (school_id, group_id, day_of_week, lesson_time, subject, room) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.schoolId, group_id || null, day_of_week || null, lesson_time || null, subject || null, room || null]
    );
    res.json({ row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/schedule/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    await getPool().query(
      'DELETE FROM schedule WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Events ---

router.get('/events', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT * FROM events WHERE school_id = $1 ORDER BY event_date ASC',
      [req.user.schoolId]
    );
    res.json({ events: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/events', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, event_date, event_time, place } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await getPool().query(
      'INSERT INTO events (school_id, name, event_date, event_time, place) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.schoolId, name, event_date || null, event_time || null, place || null]
    );
    res.json({ event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/events/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    await getPool().query(
      'DELETE FROM events WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
