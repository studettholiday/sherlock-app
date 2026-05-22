const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const getPool = () => new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, TXT, and MD files allowed'));
  }
});

async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  return buffer.toString('utf8');
}

// Upload file (owner only)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!req.user.is_owner) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    console.log('[library] POST /upload file=%s size=%d schoolId=%s', req.file.originalname, req.file.size, req.user.schoolId);
    const content = await extractText(req.file.buffer, req.file.mimetype);
    const result = await getPool().query(
      'INSERT INTO library_files (school_id, filename, file_path, file_size, mime_type, uploaded_by, content) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.schoolId, req.file.originalname, '', req.file.size, req.file.mimetype, req.user.userId, content]
    );
    console.log('[library] POST /upload inserted id=%s', result.rows[0].id);
    res.json({ file: result.rows[0] });
  } catch (err) {
    console.error('[library] POST /upload error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all library files for school
router.get('/', authMiddleware, async (req, res) => {
  console.log("[library] GET / schoolId=%s userId=%s", req.user.schoolId, req.user.userId);
  if (!req.user || !req.user.schoolId) {
    console.log('[library] GET / REJECTED - no schoolId in token. req.user=', JSON.stringify(req.user));
    return res.status(401).json({ error: 'No school context in token' });
  }
  if (!req.user.schoolId) return res.status(400).json({ error: "No school context" });
  try {
    console.log('[library] GET / schoolId=%s role=%s', req.user.schoolId, req.user.role);
    const debugResult = await getPool().query('SELECT COUNT(*) as cnt FROM library_files');
    console.log('[library] TOTAL rows in table:', debugResult.rows[0].cnt);
    const debugResult2 = await getPool().query('SELECT COUNT(*) as cnt FROM library_files WHERE school_id = $1', [req.user.schoolId]);
    console.log('[library] rows for schoolId', req.user.schoolId, ':', debugResult2.rows[0].cnt);
    const result = await getPool().query(
      'SELECT id, filename, file_size, mime_type, created_at FROM library_files WHERE school_id = $1 ORDER BY created_at DESC',
      [req.user.schoolId]
    );
    console.log('[library] GET / returned %d rows', result.rows.length);
    res.json({ files: result.rows });
  } catch (err) {
    console.error('[library] GET / error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await getPool().query(
      'SELECT * FROM library_files WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'File not found' });
    const file = result.rows[0];
    if (file.file_path && fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path);
    await getPool().query('DELETE FROM library_files WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get library content for AI context (internal use)
router.get('/context', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT filename, content FROM library_files WHERE school_id = $1 AND content IS NOT NULL',
      [req.user.schoolId]
    );
    res.json({ files: result.rows.map(f => ({ filename: f.filename, content: f.content })) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Download file content as text
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT filename, content, mime_type FROM library_files WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const file = result.rows[0];
    if (!file.content) return res.status(404).json({ error: 'No content available' });
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(file.content);
  } catch (err) {
    console.error('[library/download] error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
