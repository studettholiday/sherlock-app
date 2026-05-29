const express = require('express');
const router = express.Router();
const pool = require('../services/db');

// Run migrations on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    school_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Waitlist migration failed:', err.message));

router.post('/waitlist', async (req, res) => {
  const { email, schoolName, schoolType } = req.body ?? {};
  if (!email || !schoolName || !schoolType) {
    return res.status(400).json({ error: 'email, schoolName, and schoolType are required' });
  }
  try {
    await pool.query(
      'INSERT INTO waitlist (email, school_name, school_type) VALUES ($1, $2, $3)',
      [email, schoolName, schoolType]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'duplicate' });
    }
    console.error('Waitlist insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
