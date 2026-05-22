const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');
const { notifyScheduleChange } = require('../services/push');

const getPool = () => new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// --- Schedule ---

router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    if (req.user.is_owner) {
      // Owners always see the full school schedule.
      const result = await getPool().query(
        'SELECT id, day_of_week, lesson_time, class_name, room FROM schedule WHERE school_id = $1 ORDER BY day_of_week, lesson_time',
        [req.user.schoolId]
      );
      return res.json({ schedule: result.rows });
    }
    // Students see only rows for classes they are assigned to. A student with
    // no assignments sees an empty schedule — the correct fallback.
    const result = await getPool().query(
      `SELECT s.id, s.day_of_week, s.lesson_time, s.class_name, s.room
       FROM schedule s
       JOIN student_classes sc
         ON sc.class_name = s.class_name AND sc.school_id = s.school_id
       WHERE s.school_id = $1 AND sc.user_id = $2
       ORDER BY s.day_of_week, s.lesson_time`,
      [req.user.schoolId, req.user.userId]
    );
    res.json({ schedule: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/schedule', authMiddleware, async (req, res) => {
  console.log('[DEBUG POST /schedule] req.user =', JSON.stringify(req.user), 'body =', JSON.stringify(req.body));
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

// --- Classes & student assignments ---

// GET /api/school/classes — the canonical list of classes that exist in this
// school, derived purely from DISTINCT schedule.class_name. Auth required.
router.get('/classes', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT DISTINCT class_name FROM schedule
       WHERE school_id = $1 AND class_name IS NOT NULL AND class_name <> ''
       ORDER BY class_name`,
      [req.user.schoolId]
    );
    res.json({ classes: result.rows.map(r => r.class_name) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/school/students — all non-owner students in the school, each with
// their assigned class names. Owner only.
router.get('/students', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await getPool().query(
      `SELECT u.id, u.name, u.email,
              COALESCE(
                array_agg(sc.class_name ORDER BY sc.class_name)
                  FILTER (WHERE sc.class_name IS NOT NULL),
                '{}'
              ) AS classes
       FROM users u
       LEFT JOIN student_classes sc ON sc.user_id = u.id
       WHERE u.school_id = $1 AND u.role = 'student' AND u.is_owner = false
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name`,
      [req.user.schoolId]
    );
    res.json({ students: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/school/students/:userId/classes — replace a student's class
// assignments. Owner only. Body: { classes: ["Math", ...] }.
router.put('/students/:userId/classes', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  const userId = parseInt(req.params.userId, 10);
  if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user id' });

  const { classes } = req.body || {};
  if (!Array.isArray(classes)) return res.status(400).json({ error: 'classes must be an array' });

  // Normalise: trim, drop blanks, dedupe.
  const requested = [...new Set(classes.map(c => String(c ?? '').trim()).filter(Boolean))];

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Cross-school guard: the target student must belong to this owner's school.
    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND school_id = $2',
      [userId, req.user.schoolId]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    // Every requested class must exist in this school's schedule.
    const validRes = await client.query(
      `SELECT DISTINCT class_name FROM schedule
       WHERE school_id = $1 AND class_name IS NOT NULL AND class_name <> ''`,
      [req.user.schoolId]
    );
    const valid = new Set(validRes.rows.map(r => r.class_name));
    const unknown = requested.filter(c => !valid.has(c));
    if (unknown.length > 0) {
      return res.status(400).json({
        error: `Unknown class(es): ${unknown.join(', ')}. These are not in the school schedule.`,
      });
    }

    // Replace all assignments inside a transaction.
    await client.query('BEGIN');
    await client.query('DELETE FROM student_classes WHERE user_id = $1', [userId]);
    for (const className of requested) {
      await client.query(
        `INSERT INTO student_classes (user_id, school_id, class_name)
         VALUES ($1, $2, $3) ON CONFLICT (user_id, class_name) DO NOTHING`,
        [userId, req.user.schoolId, className]
      );
    }
    await client.query('COMMIT');

    res.json({ classes: requested.sort() });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    console.error('[students] PUT classes error:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
    try { await pool.end(); } catch (_) { /* ignore */ }
  }
});

module.exports = router;
