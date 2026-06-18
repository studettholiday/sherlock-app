const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

if (!process.env.JWT_SECRET) {
  throw new Error('[boot] JWT_SECRET environment variable is required — refusing to start with insecure default.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// The ONLY routes a member who has been removed from their school may still
// reach. Everything else is 403 (deny-by-default) — see the removed_at branch
// below. Account-deletion is the existing 21-day self-delete flow; logout is
// purely client-side (no server route), so it needs no allowance here.
function removedMemberMayAccess(req) {
  const path = (req.originalUrl || '').split('?')[0];
  return req.method === 'POST' && path === '/api/auth/self-delete';
}

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = decoded;
  try {
    const result = await pool.query(
      'SELECT u.deleted_at AS user_deleted_at, u.removed_at AS removed_at, s.deleted_at AS school_deleted_at FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const { user_deleted_at, removed_at, school_deleted_at } = result.rows[0];
    if (decoded.recovery_only) return next();
    if (school_deleted_at) return res.status(423).json({ deleted: true, deleted_at: school_deleted_at, scope: 'school' });
    if (user_deleted_at)   return res.status(423).json({ deleted: true, deleted_at: user_deleted_at,   scope: 'user'   });
    // Removed from school: deny-by-default. The removed member keeps a valid
    // login (so they can act on their own account) but is locked out of every
    // school feature here — the single enforcement gate. The only thing they
    // may still do is delete their own account (self-delete).
    if (removed_at && !removedMemberMayAccess(req)) {
      return res.status(403).json({ removed: true, error: 'Removed from school' });
    }
    next();
  } catch (err) {
    console.error('[auth] db check failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
