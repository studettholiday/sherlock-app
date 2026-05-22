const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sherlock-secret-change-in-production';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    console.log('[DEBUG auth] populated req.user =', JSON.stringify(req.user), 'path =', req.path, 'method =', req.method);
    console.log('[auth] decoded token:', JSON.stringify(decoded));
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
