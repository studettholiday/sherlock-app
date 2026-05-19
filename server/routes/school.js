const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
          "DELETE FROM web_registrations WHERE user_id = $1 AND group_id = $2 AND status = 'approved'",
          [reg.user_id, reg.group_id]
        );
        await pool.query(
          'DELETE FROM web_registrations WHERE id = $1',
          [req.params.id]
        );
        await pool.query(
          'INSERT INTO notifications (recipient_id, school_id, message) VALUES ($1, $2, $3)',
          [reg.user_id, reg.school_id, `✅ Your request to leave ${groupLabel} has been approved!`]
        );
        return res.json({ ok: true });
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
          'INSERT INTO notifications (recipient_id, school_id, message) VALUES ($1, $2, $3)',
          [reg.user_id, reg.school_id, `✅ Your request to join ${groupLabel} has been approved!`]
        );
      }
    } else {
      const leaveMsg = reg.request_type === 'remove'
        ? `❌ Your request to leave ${groupLabel} was not approved.`
        : `❌ Your request to join ${groupLabel} was not approved.`;
      await pool.query(
        'INSERT INTO notifications (recipient_id, school_id, message) VALUES ($1, $2, $3)',
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

// --- Notes: Image upload ---

router.post('/notes/upload-image', authMiddleware, imageUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'File must be an image' });
  try {
    const b64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${b64}`;
    res.json({ url: dataUrl });
  } catch (err) {
    console.error('[notes/upload-image] error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes: Labels ---

router.get('/notes/labels', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT * FROM student_labels WHERE user_id = $1 AND school_id = $2 ORDER BY created_at ASC',
      [req.user.userId, req.user.schoolId]
    );
    res.json({ labels: result.rows });
  } catch (err) {
    console.error('[notes/labels] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/notes/labels', authMiddleware, async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await getPool().query(
      "INSERT INTO student_labels (user_id, school_id, name, color) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.userId, req.user.schoolId, name, color || '#7C3AED']
    );
    res.json({ label: result.rows[0] });
  } catch (err) {
    console.error('[notes/labels] POST error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notes/labels/:id', authMiddleware, async (req, res) => {
  try {
    await getPool().query(
      'DELETE FROM student_labels WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[notes/labels] DELETE error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes ---

router.get('/notes', authMiddleware, async (req, res) => {
  const { label_id, q } = req.query;
  try {
    let query = `SELECT n.*, l.name AS label_name, l.color AS label_color
      FROM student_notes n
      LEFT JOIN student_labels l ON n.label_id = l.id
      WHERE n.user_id = $1 AND n.school_id = $2 AND n.deleted_at IS NULL`;
    const params = [req.user.userId, req.user.schoolId];
    if (label_id) { params.push(label_id); query += ` AND n.label_id = $${params.length}`; }
    if (q) { params.push(`%${q}%`); query += ` AND (n.title ILIKE $${params.length} OR n.content ILIKE $${params.length})`; }
    query += ' ORDER BY n.updated_at DESC';
    const result = await getPool().query(query, params);
    res.json({ notes: result.rows });
  } catch (err) {
    console.error('[notes] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/notes', authMiddleware, async (req, res) => {
  const { title, content, label_id, image_url } = req.body;
  if (!title && !content && !image_url) return res.status(400).json({ error: 'Note must have title, content, or image' });
  try {
    const result = await getPool().query(
      'INSERT INTO student_notes (user_id, school_id, title, content, label_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.userId, req.user.schoolId, title || null, content || '', label_id || null, image_url || null]
    );
    res.json({ note: result.rows[0] });
  } catch (err) {
    console.error('[notes] POST error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/notes/:id', authMiddleware, async (req, res) => {
  const body = req.body;
  const sets = [], params = [];
  if ('label_id'  in body) { params.push(body.label_id  ?? null); sets.push(`label_id = $${params.length}`); }
  if ('title'     in body) { params.push(body.title     || null); sets.push(`title = $${params.length}`); }
  if ('content'   in body) { params.push(body.content   || '');   sets.push(`content = $${params.length}`); }
  if ('image_url' in body) { params.push(body.image_url || null); sets.push(`image_url = $${params.length}`); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id, req.user.userId);
  try {
    const result = await getPool().query(
      `UPDATE student_notes SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ note: result.rows[0] });
  } catch (err) {
    console.error('[notes] PATCH error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    await getPool().query('UPDATE student_notes SET deleted_at = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[notes] DELETE error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes: Diary ---

router.get('/notes/diary', authMiddleware, async (req, res) => {
  const { label_id, q } = req.query;
  try {
    let query = `SELECT d.*, l.name AS label_name, l.color AS label_color
      FROM student_diary d
      LEFT JOIN student_labels l ON d.label_id = l.id
      WHERE d.user_id = $1 AND d.school_id = $2 AND d.deleted_at IS NULL`;
    const params = [req.user.userId, req.user.schoolId];
    if (label_id) { params.push(label_id); query += ` AND d.label_id = $${params.length}`; }
    if (q) { params.push(`%${q}%`); query += ` AND (d.practiced ILIKE $${params.length} OR d.goal ILIKE $${params.length})`; }
    query += ' ORDER BY d.created_at DESC';
    const result = await getPool().query(query, params);
    res.json({ entries: result.rows });
  } catch (err) {
    console.error('[notes/diary] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/notes/diary', authMiddleware, async (req, res) => {
  const { mood, practiced, goal, label_id, image_url } = req.body;
  if (!practiced) return res.status(400).json({ error: 'practiced is required' });
  try {
    const result = await getPool().query(
      'INSERT INTO student_diary (user_id, school_id, mood, practiced, goal, label_id, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.userId, req.user.schoolId, mood || null, practiced, goal || null, label_id || null, image_url || null]
    );
    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('[notes/diary] POST error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/notes/diary/:id', authMiddleware, async (req, res) => {
  const body = req.body;
  const sets = [], params = [];
  if ('label_id'  in body) { params.push(body.label_id  ?? null); sets.push(`label_id = $${params.length}`); }
  if ('mood'      in body) { params.push(body.mood      || null); sets.push(`mood = $${params.length}`); }
  if ('practiced' in body) { params.push(body.practiced);         sets.push(`practiced = $${params.length}`); }
  if ('goal'      in body) { params.push(body.goal      || null); sets.push(`goal = $${params.length}`); }
  if ('image_url' in body) { params.push(body.image_url || null); sets.push(`image_url = $${params.length}`); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id, req.user.userId);
  try {
    const result = await getPool().query(
      `UPDATE student_diary SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('[notes/diary] PATCH error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notes/diary/:id', authMiddleware, async (req, res) => {
  try {
    await getPool().query('UPDATE student_diary SET deleted_at = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[notes/diary] DELETE error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notes: Trash ---

router.get('/notes/trash', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT id, title, content, image_url, 'note' AS type, deleted_at FROM student_notes
      WHERE user_id = $1 AND deleted_at > NOW() - INTERVAL '24 hours'
      UNION ALL
      SELECT id, NULL AS title, practiced AS content, image_url, 'diary' AS type, deleted_at FROM student_diary
      WHERE user_id = $1 AND deleted_at > NOW() - INTERVAL '24 hours'
      ORDER BY deleted_at DESC
    `, [req.user.userId]);
    res.json({ items: result.rows });
  } catch (err) {
    console.error('[notes/trash] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/notes/trash/:id/restore', authMiddleware, async (req, res) => {
  const { type } = req.query;
  const table = type === 'diary' ? 'student_diary' : 'student_notes';
  try {
    await getPool().query(`UPDATE ${table} SET deleted_at = NULL WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[notes/trash] restore error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/notes/trash/:id/permanent', authMiddleware, async (req, res) => {
  const { type } = req.query;
  const table = type === 'diary' ? 'student_diary' : 'student_notes';
  try {
    await getPool().query(`DELETE FROM ${table} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[notes/trash] permanent delete error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Absences ---

router.post('/absences', authMiddleware, async (req, res) => {
  const { group_id, date, time, reason, type } = req.body;
  if (!date || !reason || !type) return res.status(400).json({ error: 'date, reason, and type are required' });
  if (!['lesson', 'event', 'exam'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  const pool = getPool();
  try {
    const userRow = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.userId]);
    const studentName = userRow.rows[0]?.name || 'A student';

    await pool.query(
      'INSERT INTO absences (user_id, school_id, group_id, type, date, time, reason) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user.userId, req.user.schoolId, group_id || null, type, date, time || null, reason]
    );

    let recipients = [];
    let message = '';

    if (type === 'lesson') {
      let groupName = 'group';
      if (group_id) {
        const gr = await pool.query('SELECT name FROM groups WHERE id = $1', [group_id]);
        groupName = gr.rows[0]?.name || groupName;
      }
      const timeStr = time ? ` at ${time}` : '';
      message = `Student ${studentName} will miss ${groupName} on ${date}${timeStr}. Reason: ${reason}`;
    } else {
      const typeLabel = type === 'exam' ? 'exam' : 'event';
      message = `Student ${studentName} will miss ${typeLabel} on ${date}. Reason: ${reason}`;
    }
    const rows = await pool.query(
      `SELECT id FROM users WHERE school_id = $1 AND role IN ('teacher', 'assistant')`,
      [req.user.schoolId]
    );
    recipients = rows.rows.map(r => r.id);

    await Promise.all(recipients.map(recipientId =>
      pool.query(
        'INSERT INTO notifications (recipient_id, school_id, type, message) VALUES ($1,$2,$3,$4)',
        [recipientId, req.user.schoolId, `absence_${type}`, message]
      )
    ));

    res.json({ success: true });
  } catch (err) {
    console.error('[absences] POST error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notifications ---

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT * FROM notifications WHERE recipient_id = $1 AND read = FALSE ORDER BY created_at DESC LIMIT 50`,
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
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND recipient_id = $2',
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
      `SELECT DISTINCT ON (s.id) s.id, s.day_of_week, s.lesson_time, g.id AS group_id, g.name AS group_name, sub.id AS subject_id, sub.name AS subject_name
       FROM web_registrations wr
       JOIN groups g ON wr.group_id = g.id
       JOIN schedule s ON s.group_id = g.id
       JOIN subjects sub ON g.subject_id = sub.id
       WHERE wr.user_id = $1 AND wr.school_id = $2 AND wr.status = 'approved'
       ORDER BY s.id`,
      [req.user.userId, req.user.schoolId]
    );
    res.json({ schedule: result.rows });
  } catch (err) {
    console.error('[my-schedule] GET error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
