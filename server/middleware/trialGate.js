// Blocks write requests from schools whose trial has expired and that have
// not subscribed. A school is treated as expired when:
//   - tier === 'trial', AND
//   - schools.created_at is older than TRIAL_DAYS days.
// Any tier other than 'trial' (starter/standard/pro/etc.) is always allowed.
//
// Mount AFTER authMiddleware on every WRITE route. Read routes stay open.

const { Pool } = require('pg');

const TRIAL_DAYS = 14;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

function isTrialExpired(tier, createdAt) {
  if (!tier || tier !== 'trial') return false;
  if (!createdAt) return false;
  return (Date.now() - new Date(createdAt).getTime()) >= TRIAL_MS;
}

async function trialGate(req, res, next) {
  try {
    const schoolId = req.user && req.user.schoolId;
    if (!schoolId) return res.status(401).json({ error: 'No school context' });
    const r = await pool.query(
      'SELECT tier, created_at FROM schools WHERE id = $1',
      [schoolId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    const { tier, created_at } = r.rows[0];
    if (isTrialExpired(tier, created_at)) {
      return res.status(403).json({ error: 'trial_expired', read_only: true });
    }
    next();
  } catch (err) {
    console.error('[trialGate] db error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = trialGate;
module.exports.isTrialExpired = isTrialExpired;
module.exports.TRIAL_DAYS = TRIAL_DAYS;
