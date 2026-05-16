const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/library';

// Ensure upload directory exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('[library] Created upload dir:', UPLOAD_DIR);
  }
} catch (e) {
  console.error('[library] Could not create upload dir:', UPLOAD_DIR, e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const schoolDir = path.join(UPLOAD_DIR, String(req.user.schoolId));
    if (!fs.existsSync(schoolDir)) fs.mkdirSync(schoolDir, { recursive: true });
    cb(null, schoolDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, TXT, and MD files allowed'));
  }
});

// Upload file (admin, assistant, teacher only)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!['admin', 'assistant', 'teacher'].includes(req.user.role)) {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    console.log('[library] POST /upload file=%s size=%d schoolId=%s', req.file.originalname, req.file.size, req.user.schoolId);
    const result = await pool.query(
      'INSERT INTO library_files (school_id, filename, file_path, file_size, mime_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.schoolId, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, req.user.userId]
    );
    console.log('[library] POST /upload inserted id=%s', result.rows[0].id);
    res.json({ file: result.rows[0] });
  } catch (err) {
    console.error('[library] POST /upload DB error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all library files for school
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[library] GET / schoolId=%s role=%s', req.user.schoolId, req.user.role);
    const result = await pool.query(
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

// Delete file (admin and assistant only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'assistant'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await pool.query(
      'SELECT * FROM library_files WHERE id = $1 AND school_id = $2',
      [req.params.id, req.user.schoolId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'File not found' });
    const file = result.rows[0];
    if (fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path);
    await pool.query('DELETE FROM library_files WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get library content for AI context (internal use)
router.get('/context', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT filename, file_path, mime_type FROM library_files WHERE school_id = $1',
      [req.user.schoolId]
    );
    const contents = [];
    for (const file of result.rows) {
      try {
        if (file.mime_type === 'application/pdf') {
          const pdfParse = require('pdf-parse');
          const buffer = fs.readFileSync(file.file_path);
          const data = await pdfParse(buffer);
          contents.push({ filename: file.filename, content: data.text });
        } else {
          const text = fs.readFileSync(file.file_path, 'utf8');
          contents.push({ filename: file.filename, content: text });
        }
      } catch (e) {
        console.error('Error reading file:', file.filename, e.message);
      }
    }
    res.json({ files: contents });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
