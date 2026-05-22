const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');
const { notifyScheduleChange } = require('../services/push');

const getPool = () => new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// --- Schedule ---

router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT id, day_of_week, lesson_time, class_name, room FROM schedule WHERE school_id = $1 ORDER BY day_of_week, lesson_time',
      [req.user.schoolId]
    );
    res.json({ schedule: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/schedule', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  const { day_of_week, lesson_time, class_name, room } = req.body;
  try {
    const result = await getPool().query(
      'INSERT INTO schedule (school_id, day_of_week, lesson_time, class_name, room) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.schoolId, day_of_week ?? null, lesson_time || null, class_name || null, room || null]
    );
    res.json({ row: result.rows[0] });
    // Fire-and-forget push broadcast — never blocks or breaks the schedule write.
    notifyScheduleChange(req.user.schoolId, 'POST', result.rows[0]);
  } catch (err) {
    console.error('[schedule] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/schedule/:id', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await getPool().query(
      'DELETE FROM schedule WHERE id = $1 AND school_id = $2 RETURNING *',
      [req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
    // Fire-and-forget push broadcast — never blocks or breaks the schedule write.
    if (result.rows[0]) notifyScheduleChange(req.user.schoolId, 'DELETE', result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/schedule/:id', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  const { day_of_week, lesson_time } = req.body;
  try {
    const result = await getPool().query(
      'UPDATE schedule SET day_of_week = $1, lesson_time = $2 WHERE id = $3 AND school_id = $4 RETURNING *',
      [day_of_week, lesson_time, req.params.id, req.user.schoolId]
    );
    res.json({ row: result.rows[0] });
    // Fire-and-forget push broadcast — never blocks or breaks the schedule write.
    if (result.rows[0]) notifyScheduleChange(req.user.schoolId, 'PATCH', result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
