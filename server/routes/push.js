const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const getPool = () => new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// GET /api/push/vapid-public-key — public. The frontend needs this key to
// call pushManager.subscribe(). Returns { key: null } if push is unconfigured.
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

// POST /api/push/subscribe — authenticated.
// Body: { endpoint, keys: { p256dh, auth } }. Stores the subscription for the
// current user + school. Idempotent via ON CONFLICT (endpoint) DO NOTHING.
router.post('/subscribe', authMiddleware, async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  try {
    await getPool().query(
      `INSERT INTO push_subscriptions (user_id, school_id, endpoint, p256dh_key, auth_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO NOTHING`,
      [req.user.userId, req.user.schoolId, endpoint, keys.p256dh, keys.auth]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[push] subscribe error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/push/unsubscribe — authenticated. Body: { endpoint }.
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
  try {
    await getPool().query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ success: true });
  } catch (err) {
    console.error('[push] unsubscribe error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
