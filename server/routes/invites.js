const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { Resend } = require('resend');
const authMiddleware = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/invites/generate
router.post('/generate', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { target_role, email } = req.body;
  if (!['assistant', 'teacher', 'student'].includes(target_role)) return res.status(400).json({ error: 'Invalid target_role' });
  try {
    const schoolResult = await pool.query('SELECT name FROM schools WHERE id = $1', [req.user.schoolId]);
    const schoolName = schoolResult.rows[0]?.name ?? 'your school';

    const result = await pool.query(
      'INSERT INTO invites (school_id, created_by, target_role) VALUES ($1, $2, $3) RETURNING code, target_role, expires_at',
      [req.user.schoolId, req.user.userId, target_role]
    );
    const invite = result.rows[0];
    const inviteUrl = `https://app.sherlock.school/invite/${invite.code}`;

    if (email) {
      await resend.emails.send({
        from: 'hello@sherlock.school',
        to: email,
        subject: `You've been invited to join ${schoolName}`,
        html: `<p>You've been invited to join <strong>${schoolName}</strong> on Sherlock.</p><p><a href="${inviteUrl}">Click here to accept your invitation</a></p><p>Or copy this link: ${inviteUrl}</p>`,
      });
    }

    res.json({
      code: invite.code,
      invite_url: inviteUrl,
      target_role: invite.target_role,
      expires_at: invite.expires_at,
      email_sent: !!email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invites
router.get('/', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await pool.query(
      `SELECT i.id, i.code, i.target_role, i.used_at, i.used_by, i.expires_at, i.created_at,
              u.name as used_by_name
       FROM invites i
       LEFT JOIN users u ON i.used_by = u.id
       WHERE i.school_id = $1 AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [req.user.schoolId]
    );
    res.json({ invites: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/invites/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await pool.query(
      'DELETE FROM invites WHERE id = $1 AND school_id = $2 RETURNING id',
      [req.params.id, req.user.schoolId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invite not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invites/validate/:code  (no auth)
router.get('/validate/:code', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.code, i.target_role, i.school_id, i.used_at, i.expires_at, s.name as school_name
       FROM invites i JOIN schools s ON i.school_id = s.id
       WHERE i.code = $1`,
      [req.params.code]
    );
    if (result.rows.length === 0) return res.json({ valid: false, reason: 'Invite not found' });
    const inv = result.rows[0];
    if (inv.used_at) return res.json({ valid: false, reason: 'Invite already used' });
    if (new Date(inv.expires_at) < new Date()) return res.json({ valid: false, reason: 'Invite expired' });
    res.json({ valid: true, target_role: inv.target_role, school_id: inv.school_id, school_name: inv.school_name });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
