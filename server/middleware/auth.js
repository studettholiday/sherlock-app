const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

if (!process.env.JWT_SECRET) {
  throw new Error('[boot] JWT_SECRET environment variable is required — refusing to start with insecure default.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

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
      'SELECT u.deleted_at AS user_deleted_at, s.deleted_at AS school_deleted_at FROM users u JOIN schools s ON u.school_id = s.id WHERE u.id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const { user_deleted_at, school_deleted_at } = result.rows[0];
    if (decoded.recovery_only) return next();
    if (school_deleted_at) return res.status(423).json({ deleted: true, deleted_at: school_deleted_at, scope: 'school' });
    if (user_deleted_at)   return res.status(423).json({ deleted: true, deleted_at: user_deleted_at,   scope: 'user'   });
    next();
  } catch (err) {
    console.error('[auth] db check failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
