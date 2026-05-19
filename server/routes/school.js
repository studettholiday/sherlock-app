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

// --- Subjects ---

router.get('/subjects', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT * FROM subjects WHERE school_id = $1 ORDER BY created_at ASC',
      [req.user.schoolId]
    );
    res.json({ subjects: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/subjects', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, emoji } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await getPool().query(
      'INSERT INTO subjects (school_id, name, emoji) VALUES ($1, $2, $3) RETURNING *',
      [req.user.schoolId, name, emoji || '📚']
    );
    res.json({ subject: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/subjects/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    await getPool().query(
      'DELETE FROM subjects WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/subjects/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, emoji } = req.body;
  const sets = []; const params = []; let idx = 1;
  if (name)  { sets.push(`name = $${idx++}`);  params.push(name); }
  if (emoji) { sets.push(`emoji = $${idx++}`); params.push(emoji); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id, req.user.schoolId);
  try {
    const result = await getPool().query(
      `UPDATE subjects SET ${sets.join(', ')} WHERE id = $${idx++} AND school_id = $${idx++} RETURNING *`,
      params
    );
    res.json({ subject: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Groups ---

router.get('/groups', authMiddleware, async (req, res) => {
  try {
    const { subject_id } = req.query;
    let query = 'SELECT g.*, s.name AS subject_name FROM groups g LEFT JOIN subjects s ON g.subject_id = s.id WHERE g.school_id = $1';
    const params = [req.user.schoolId];
    if (subject_id) {
      query += ' AND g.subject_id = $2';
      params.push(subject_id);
    }
    query += ' ORDER BY g.name ASC';
    const result = await getPool().query(query, params);
    res.json({ groups: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/groups', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, instrument, subject_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await getPool().query(
      'INSERT INTO groups (school_id, name, instrument, subject_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.schoolId, name, instrument || null, subject_id || null]
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

router.patch('/groups/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await getPool().query(
      'UPDATE groups SET name = $1 WHERE id = $2 AND school_id = $3 RETURNING *',
      [name, req.params.id, req.user.schoolId]
    );
    res.json({ group: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Schedule ---

router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const { group_id } = req.query;
    let query = `SELECT s.*, g.name AS group_name
       FROM schedule s
       LEFT JOIN groups g ON s.group_id = g.id
       WHERE s.school_id = $1`;
    const params = [req.user.schoolId];
    if (group_id) {
      query += ' AND s.group_id = $2';
      params.push(group_id);
    }
    query += ' ORDER BY s.day_of_week, s.lesson_time';
    const result = await getPool().query(query, params);
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
    console.error('[schedule] POST error:', err.message);
    res.status(500).json({ error: err.message });
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

router.patch('/schedule/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { day_of_week, lesson_time } = req.body;
  try {
    const result = await getPool().query(
      'UPDATE schedule SET day_of_week = $1, lesson_time = $2 WHERE id = $3 AND school_id = $4 RETURNING *',
      [day_of_week, lesson_time, req.params.id, req.user.schoolId]
    );
    res.json({ row: result.rows[0] });
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

// --- Web Registrations ---

router.post('/web-registrations', authMiddleware, async (req, res) => {
  console.log('[web-reg] body:', req.body);
  console.log('[web-reg] user:', { userId: req.user.userId, role: req.user.role, schoolId: req.user.schoolId });
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  const { group_id, group_ids, request_type } = req.body;
  const ids = group_ids || (group_id ? [group_id] : null);
  const reqType = request_type || 'add';
  if (!Array.isArray(ids) || ids.length === 0) {
    console.log('[web-reg] rejected: no valid group_id(s)');
    return res.status(400).json({ error: 'group_id or group_ids is required' });
  }
  const pool = getPool();
  try {
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM web_registrations WHERE user_id = $1 AND status = 'pending'",
      [req.user.userId]
    );
    const pendingCount = parseInt(countRes.rows[0].count, 10);
    if (pendingCount + ids.length > 3) {
      return res.status(429).json({ error: 'Maximum 3 pending requests allowed' });
    }
    for (const groupId of ids) {
      const dup = await pool.query(
        "SELECT id FROM web_registrations WHERE user_id = $1 AND group_id = $2 AND status = 'approved'",
        [req.user.userId, groupId]
      );
      if (dup.rows.length) {
        return res.status(409).json({ error: 'Already enrolled in this group' });
      }
      const pendingDup = await pool.query(
        "SELECT id FROM web_registrations WHERE user_id = $1 AND group_id = $2 AND status = 'pending'",
        [req.user.userId, groupId]
      );
      if (pendingDup.rows.length) {
        return res.status(409).json({ error: 'Request already pending for this group' });
      }
    }
    for (const groupId of ids) {
      await pool.query(
        'INSERT INTO web_registrations (user_id, group_id, school_id, status, request_type) VALUES ($1, $2, $3, $4, $5)',
        [req.user.userId, groupId, req.user.schoolId, 'pending', reqType]
      );
    }
    console.log('[web-reg] inserted', ids.length, 'registration(s) for user', req.user.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('[web-registrations] POST error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/web-registrations/remove-request', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { group_id } = req.body;
    if (!group_id) return res.status(400).json({ error: 'group_id is required' });
    const pool = getPool();
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM web_registrations WHERE user_id = $1 AND status = 'pending'",
      [req.user.userId]
    );
    if (parseInt(countRes.rows[0].count, 10) >= 3) return res.status(429).json({ error: 'Maximum 3 pending requests allowed' });
    const pendingDup = await pool.query(
      "SELECT id FROM web_registrations WHERE user_id = $1 AND group_id = $2 AND status = 'pending' AND request_type = 'remove'",
      [req.user.userId, group_id]
    );
    if (pendingDup.rows.length) return res.status(409).json({ error: 'Removal request already pending for this group' });
    await pool.query(
      "INSERT INTO web_registrations (user_id, group_id, school_id, status, request_type) VALUES ($1, $2, $3, 'pending', 'remove')",
      [req.user.userId, group_id, req.user.schoolId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[web-registrations/remove-request] error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/web-registrations', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const params = [req.user.schoolId];
  let statusClause = '';
  if (req.query.status) {
    params.push(req.query.status);
    statusClause = ` AND wr.status = $${params.length}`;
  }
  try {
    const result = await getPool().query(
      `SELECT wr.id, wr.status, wr.created_at, wr.request_type,
              u.name AS user_name, u.email AS user_email,
              g.name AS group_name, s.name AS subject_name,
              COALESCE(
                (SELECT array_agg(sc.day_of_week || ' ' || sc.lesson_time ORDER BY sc.day_of_week, sc.lesson_time)
                 FROM schedule sc WHERE sc.group_id = g.id),
                ARRAY[]::text[]
              ) AS schedule_times
       FROM web_registrations wr
       JOIN users u  ON wr.user_id  = u.id
       JOIN groups g ON wr.group_id = g.id
       LEFT JOIN subjects s ON g.subject_id = s.id
       WHERE wr.school_id = $1${statusClause}
       ORDER BY wr.created_at DESC`,
      params
    );
    res.json({ registrations: result.rows });
  } catch (err) {
    console.error('[web-registrations] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/web-registrations/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const pool = getPool();
  try {
    const result = await pool.query(
      'UPDATE web_registrations SET status = $1 WHERE id = $2 AND school_id = $3 RETURNING *',
      [status, req.params.id, req.user.schoolId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const reg = result.rows[0];
    const groupInfoRes = await pool.query(
      `SELECT g.name AS group_name, s.name AS subject_name, g.subject_id
       FROM groups g LEFT JOIN subjects s ON g.subject_id = s.id WHERE g.id = $1`,
      [reg.group_id]
    );
    const groupInfo = groupInfoRes.rows[0] || {};
    const groupLabel = groupInfo.group_name
      ? `${groupInfo.group_name}${groupInfo.subject_name ? ` (${groupInfo.subject_name})` : ''}`
      : `group #${reg.group_id}`;

    if (status === 'approved') {
      if (reg.request_type === 'remove') {
        await pool.query(
          "DELETE FROM web_registrations WHERE user_id = $1 AND group_id = $2 AND status = 'approved' AND request_type != 'remove'",
          [reg.user_id, reg.group_id]
        );
        await pool.query(
          'INSERT INTO notifications (user_id, school_id, message) VALUES ($1, $2, $3)',
          [reg.user_id, reg.school_id, `✅ Your request to leave ${groupLabel} has been approved!`]
        );
      } else {
        if (reg.request_type === 'change' && groupInfo.subject_id) {
          await pool.query(
            `DELETE FROM web_registrations
             WHERE user_id = $1 AND id != $2 AND status = 'approved'
               AND group_id IN (SELECT id FROM groups WHERE subject_id = $3)`,
            [reg.user_id, reg.id, groupInfo.subject_id]
          );
        }
        await pool.query(
          'INSERT INTO notifications (user_id, school_id, message) VALUES ($1, $2, $3)',
          [reg.user_id, reg.school_id, `✅ Your request to join ${groupLabel} has been approved!`]
        );
      }
    } else {
      const leaveMsg = reg.request_type === 'remove'
        ? `❌ Your request to leave ${groupLabel} was not approved.`
        : `❌ Your request to join ${groupLabel} was not approved.`;
      await pool.query(
        'INSERT INTO notifications (user_id, school_id, message) VALUES ($1, $2, $3)',
        [reg.user_id, reg.school_id, leaveMsg]
      );
    }
    res.json({ registration: reg });
  } catch (err) {
    console.error('[web-registrations] PATCH error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/web-registrations/:id', authMiddleware, async (req, res) => {
  const pool = getPool();
  try {
    const reg = await pool.query(
      'SELECT user_id FROM web_registrations WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    if (!reg.rows.length) return res.status(404).json({ error: 'Not found' });
    const isOwner = reg.rows[0].user_id === req.user.userId;
    const isAdmin = ['admin', 'assistant'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await pool.query(
      'DELETE FROM web_registrations WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[web-registrations] DELETE error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notifications ---

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT * FROM notifications WHERE user_id = $1 AND read = FALSE ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await getPool().query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- My Schedule (student) ---

router.get('/my-schedule', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT s.id, s.day_of_week, s.lesson_time, g.id AS group_id, g.name AS group_name, g.subject_id, sub.name AS subject_name
       FROM web_registrations wr
       JOIN groups g ON wr.group_id = g.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       JOIN schedule s ON s.group_id = g.id
       WHERE wr.user_id = $1 AND wr.status = 'approved' AND wr.school_id = $2
       ORDER BY s.day_of_week, s.lesson_time`,
      [req.user.userId, req.user.schoolId]
    );
    res.json({ schedule: result.rows });
  } catch (err) {
    console.error('[my-schedule] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
