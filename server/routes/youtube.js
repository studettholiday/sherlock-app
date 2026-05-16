const express = require('express');
const router = express.Router();
const { searchYouTube } = require('../services/ai');

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const results = await searchYouTube(q);
    res.json({ results });
  } catch (err) {
    console.error('YouTube search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
