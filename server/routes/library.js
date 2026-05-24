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
    // Owner sees every file in the school; student sees only files that are
    // either untagged (public) or carry at least one tag matching a class
    // they're assigned to via student_classes. Both branches aggregate the
    // file's full tag list as `classes: string[]` for display.
    const sql = req.user.is_owner
      ? `SELECT lf.id, lf.filename, lf.file_size, lf.mime_type, lf.created_at,
                COALESCE(array_agg(DISTINCT lfc.class_name ORDER BY lfc.class_name)
                           FILTER (WHERE lfc.class_name IS NOT NULL), '{}') AS classes
         FROM library_files lf
         LEFT JOIN library_file_classes lfc ON lfc.file_id = lf.id
         WHERE lf.school_id = $1
         GROUP BY lf.id, lf.filename, lf.file_size, lf.mime_type, lf.created_at
         ORDER BY lf.created_at DESC`
      : `SELECT lf.id, lf.filename, lf.file_size, lf.mime_type, lf.created_at,
                COALESCE(array_agg(DISTINCT lfc.class_name ORDER BY lfc.class_name)
                           FILTER (WHERE lfc.class_name IS NOT NULL), '{}') AS classes
         FROM library_files lf
         LEFT JOIN library_file_classes lfc ON lfc.file_id = lf.id
         WHERE lf.school_id = $1
           AND (
             NOT EXISTS (SELECT 1 FROM library_file_classes lfc2 WHERE lfc2.file_id = lf.id)
             OR EXISTS (
               SELECT 1 FROM library_file_classes lfc3
               JOIN student_classes sc ON sc.class_name = lfc3.class_name AND sc.school_id = lfc3.school_id
               WHERE lfc3.file_id = lf.id AND sc.user_id = $2
             )
           )
         GROUP BY lf.id, lf.filename, lf.file_size, lf.mime_type, lf.created_at
         ORDER BY lf.created_at DESC`;
    const params = req.user.is_owner
      ? [req.user.schoolId]
      : [req.user.schoolId, req.user.userId];
    const result = await getPool().query(sql, params);
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

// PUT /api/library/:fileId/classes — replace the file's class-tag set.
// Owner only. Body: { classes: ["Math", ...] }. Empty array = public to school.
router.put('/:fileId/classes', authMiddleware, async (req, res) => {
  if (!req.user.is_owner) return res.status(403).json({ error: 'Forbidden' });
  const fileId = parseInt(req.params.fileId, 10);
  if (!Number.isInteger(fileId)) return res.status(400).json({ error: 'Invalid file id' });

  const { classes } = req.body || {};
  if (!Array.isArray(classes)) return res.status(400).json({ error: 'classes must be an array' });

  // Normalise: trim, drop blanks, dedupe.
  const requested = [...new Set(classes.map(c => String(c ?? '').trim()).filter(Boolean))];

  const pool = getPool();
  const client = await pool.connect();
  try {
    // Cross-file safety: the target file must belong to this owner's school.
    const fileRes = await client.query(
      'SELECT id FROM library_files WHERE id = $1 AND school_id = $2',
      [fileId, req.user.schoolId]
    );
    if (fileRes.rows.length === 0) return res.status(404).json({ error: 'File not found' });

    // Every requested class must exist in this school's schedule.
    const validRes = await client.query(
      `SELECT DISTINCT class_name FROM schedule
       WHERE school_id = $1 AND class_name IS NOT NULL AND class_name <> ''`,
      [req.user.schoolId]
    );
    const valid = new Set(validRes.rows.map(r => r.class_name));
    const unknown = requested.filter(c => !valid.has(c));
    if (unknown.length > 0) {
      return res.status(400).json({
        error: `Unknown class(es): ${unknown.join(', ')}. These are not in the school schedule.`,
      });
    }

    // Replace all tags inside a transaction.
    await client.query('BEGIN');
    await client.query('DELETE FROM library_file_classes WHERE file_id = $1', [fileId]);
    for (const className of requested) {
      await client.query(
        `INSERT INTO library_file_classes (file_id, school_id, class_name)
         VALUES ($1, $2, $3) ON CONFLICT (file_id, class_name) DO NOTHING`,
        [fileId, req.user.schoolId, className]
      );
    }
    await client.query('COMMIT');

    res.json({ classes: requested.sort() });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    console.error('[library] PUT classes error:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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
    // Access check: owners always allowed; students only if the file is
    // untagged (public) or has a tag matching one of their assigned classes.
    // Access denial returns 404 (same as not-found) so students can't probe
    // for tagged file_ids that exist but they can't reach.
    const sql = req.user.is_owner
      ? 'SELECT filename, content, mime_type FROM library_files WHERE id = $1 AND school_id = $2'
      : `SELECT lf.filename, lf.content, lf.mime_type
         FROM library_files lf
         WHERE lf.id = $1 AND lf.school_id = $2
           AND (
             NOT EXISTS (SELECT 1 FROM library_file_classes WHERE file_id = lf.id)
             OR EXISTS (
               SELECT 1 FROM library_file_classes lfc
               JOIN student_classes sc ON sc.class_name = lfc.class_name AND sc.school_id = lfc.school_id
               WHERE lfc.file_id = lf.id AND sc.user_id = $3
             )
           )`;
    const params = req.user.is_owner
      ? [req.params.id, req.user.schoolId]
      : [req.params.id, req.user.schoolId, req.user.userId];
    const result = await getPool().query(sql, params);
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
