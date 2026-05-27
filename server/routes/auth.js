const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { Resend } = require('resend');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const { renderEmail } = require('../lib/emailTemplate');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';
const resend = new Resend(process.env.RESEND_API_KEY);

// Looks up `email` against (users JOIN schools) and reports its signup-eligibility:
//   null                          → no row, free to sign up
//   { exists_but_active: true }   → row exists and isn't soft-deleted → 'Email already registered'
//   { recently_deleted: true, … } → row exists but is within 21-day grace → 409 payload ready to return
async function checkEmailRecentlyDeleted(email) {
  const existing = await pool.query(
    `SELECT u.deleted_at AS user_deleted_at, s.deleted_at AS school_deleted_at
     FROM users u JOIN schools s ON u.school_id = s.id
     WHERE u.email = $1`,
    [email]
  );
  if (existing.rows.length === 0) return null;
  const row = existing.rows[0];
  const dt = row.school_deleted_at || row.user_deleted_at;
  if (!dt) return { exists_but_active: true };
  const availDate = new Date(new Date(dt).getTime() + 21 * 24 * 3600 * 1000);
  return {
    recently_deleted: true,
    error: `This email is associated with a recently deleted account. It will be available for new signups after ${availDate.toISOString().slice(0,10)}.`,
    available_at: availDate.toISOString(),
  };
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `https://app.sherlock.school/verify-email?token=${token}`;
  await resend.emails.send({
    from: 'Sherlock <noreply@sherlock.school>',
    to: email,
    subject: 'Verify your email',
    html: renderEmail({
      title: 'Verify your email',
      bodyHtml: '<p>Welcome to Sherlock. Please verify your email to activate your account.</p>',
      buttonText: 'Verify email',
      buttonUrl: verifyUrl,
      footerNote: "This link expires in 24 hours. Didn't sign up? Ignore this email.",
    }),
  });
}

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
      const emailCheck = await checkEmailRecentlyDeleted(email);
      if (emailCheck?.recently_deleted) {
        return res.status(409).json({ error: emailCheck.error, recently_deleted: true, available_at: emailCheck.available_at });
      }
      if (emailCheck?.exists_but_active) return res.status(409).json({ error: 'Email already registered' });
      const hash = await bcrypt.hash(password, 12);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const userResult = await pool.query(
        `INSERT INTO users (school_id, email, password_hash, role, name, verification_token, verification_token_expires)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours') RETURNING id`,
        [invite.school_id, email, hash, invite.target_role, name || email.split('@')[0], verificationToken]
      );
      await pool.query('UPDATE invites SET used_by = $1, used_at = NOW() WHERE code = $2', [userResult.rows[0].id, invite_code]);
      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (emailErr) {
        console.error('[signup/invite] verification email send failed:', emailErr.message);
      }
      return res.json({ verification_required: true, email });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // Standard school registration
  if (!schoolName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const emailCheck = await checkEmailRecentlyDeleted(email);
    if (emailCheck?.recently_deleted) {
      return res.status(409).json({ error: emailCheck.error, recently_deleted: true, available_at: emailCheck.available_at });
    }
    if (emailCheck?.exists_but_active) return res.status(409).json({ error: 'Email already registered' });
    const schoolResult = await pool.query(
      'INSERT INTO schools (name, api_key_encrypted, director_name, phone, website, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [schoolName, apiKey || null, directorName || null, phone || null, website || null, 'approved']
    );
    const schoolId = schoolResult.rows[0].id;
    const hash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO users (school_id, email, password_hash, role, name, is_owner, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '24 hours')`,
      [schoolId, email, hash, 'student', email.split('@')[0], true, verificationToken]
    );
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error('[signup] verification email send failed:', emailErr.message);
    }
    res.json({ verification_required: true, email });
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
      'SELECT u.*, u.is_owner, u.deleted_at, s.name as school_name, s.api_key_encrypted, s.status as school_status, s.deleted_at AS school_deleted_at FROM users u JOIN schools s ON u.school_id = s.id WHERE u.email = $1',
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.email_verified === false) {
      return res.status(403).json({ error: 'Email not verified', email_verified: false, email });
    }
    if (user.deleted_at || user.school_deleted_at) {
      const scope = user.school_deleted_at ? 'school' : 'user';
      const deleted_at = user.school_deleted_at || user.deleted_at;
      const recoveryToken = jwt.sign(
        { userId: user.id, schoolId: user.school_id, recovery_only: true, scope },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      return res.json({ token: recoveryToken, recovery_required: true, scope, deleted_at });
    }
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
      'SELECT u.id, u.email, u.role, u.name, u.is_owner, u.school_id, u.deleted_at, s.name as school_name, s.api_key_encrypted, s.status as school_status, s.student_ai_enabled, s.student_downloads_enabled, s.deleted_at AS school_deleted_at FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    if (user.school_deleted_at) return res.status(423).json({ deleted: true, deleted_at: user.school_deleted_at, scope: 'school' });
    if (user.deleted_at)        return res.status(423).json({ deleted: true, deleted_at: user.deleted_at,        scope: 'user'   });
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name, is_owner: user.is_owner, schoolId: user.school_id, schoolName: user.school_name, schoolStatus: user.school_status, hasApiKey: !!user.api_key_encrypted, student_ai_enabled: user.student_ai_enabled, student_downloads_enabled: user.student_downloads_enabled });
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
        from: 'Sherlock <noreply@sherlock.school>',
        to: email,
        subject: 'Reset your Sherlock password',
        html: renderEmail({
          title: 'Reset your password',
          bodyHtml: '<p>You requested a password reset for your Sherlock account.</p>',
          buttonText: 'Reset password',
          buttonUrl: resetLink,
          footerNote: "This link expires in 1 hour. Didn't request this? Ignore this email.",
        }),
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
    const emailCheck = await checkEmailRecentlyDeleted(email);
    if (emailCheck?.recently_deleted) {
      return res.status(409).json({ error: emailCheck.error, recently_deleted: true, available_at: emailCheck.available_at });
    }
    if (emailCheck?.exists_but_active) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const userResult = await pool.query(
      `INSERT INTO users (school_id, email, password_hash, role, name, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours') RETURNING id`,
      [invite.school_id, email, hash, invite.target_role, name, verificationToken]
    );
    await pool.query('UPDATE invites SET used_by = $1, used_at = NOW() WHERE code = $2', [userResult.rows[0].id, token]);
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error('[invite/accept] verification email send failed:', emailErr.message);
    }
    return res.json({ verification_required: true, email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Self-delete: owner deletes the school, student deletes themselves.
// Sets deleted_at = NOW(); hard-deletion happens via cleanup script after 21 days.
router.post('/self-delete', authMiddleware, async (req, res) => {
  if (req.user.recovery_only) return res.status(403).json({ error: 'Recovery token cannot delete' });
  try {
    if (req.user.is_owner) {
      await pool.query('UPDATE schools SET deleted_at = NOW() WHERE id = $1', [req.user.schoolId]);
    } else {
      await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [req.user.userId]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Recover from soft-delete during the 21-day grace period.
// Requires a recovery_only token (issued by /login when the account is deleted).
router.post('/recover', authMiddleware, async (req, res) => {
  if (!req.user.recovery_only) return res.status(403).json({ error: 'Recovery token required' });
  try {
    if (req.user.scope === 'school') {
      await pool.query('UPDATE schools SET deleted_at = NULL WHERE id = $1', [req.user.schoolId]);
    } else {
      await pool.query('UPDATE users SET deleted_at = NULL WHERE id = $1', [req.user.userId]);
    }
    const r = await pool.query(
      'SELECT u.id, u.email, u.role, u.name, u.is_owner, u.school_id, s.name as school_name, s.status as school_status FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [req.user.userId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = r.rows[0];
    const newToken = jwt.sign(
      { userId: u.id, schoolId: u.school_id, role: u.role, is_owner: u.is_owner },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token: newToken,
      user: { id: u.id, email: u.email, role: u.role, name: u.name, is_owner: u.is_owner, schoolId: u.school_id, schoolName: u.school_name, schoolStatus: u.school_status },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel recovery: stateless. Client clears its token and redirects to signup.
router.post('/recover-cancel', authMiddleware, async (req, res) => {
  if (!req.user.recovery_only) return res.status(403).json({ error: 'Recovery token required' });
  res.json({ ok: true });
});

// Verify email via link in verification email.
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const result = await pool.query(
      'SELECT id, email FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired link' });
    const { id, email } = result.rows[0];
    await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
      [id]
    );
    res.json({ ok: true, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resend verification email. Always returns 200 to prevent email enumeration.
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND email_verified = false',
      [email]
    );
    if (result.rows.length > 0) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `UPDATE users SET verification_token = $1, verification_token_expires = NOW() + INTERVAL '24 hours' WHERE id = $2`,
        [verificationToken, result.rows[0].id]
      );
      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (emailErr) {
        console.error('[resend-verification] email send failed:', emailErr.message);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
