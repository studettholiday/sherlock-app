const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// Per-user rate limit: 60 messages per hour
const rateLimitStore = new Map();
const MAX_PER_HOUR = 60;
const WINDOW_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [k, e] of rateLimitStore) {
    if (now >= e.resetAt) rateLimitStore.delete(k);
  }
}, WINDOW_MS);

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_HOUR) return false;
  entry.count += 1;
  return true;
}

async function getLibraryContext(schoolId) {
  try {
    const result = await pool.query(
      'SELECT id, filename, content FROM library_files WHERE school_id = $1 AND content IS NOT NULL',
      [schoolId]
    );
    return result.rows.map(f => ({ id: f.id, filename: f.filename, content: f.content }));
  } catch (err) {
    console.error('Library fetch error:', err.message);
    return [];
  }
}

function buildSystemPrompt(user, mode, libraryFiles, language) {
  const role = user.role;
  const schoolName = user.schoolName;

  const roleContext = {
    teacher:   `You are assisting a teacher at ${schoolName}.`,
    student:   `You are assisting a student at ${schoolName}.`,
  }[role] || `You are assisting a member of ${schoolName}.`;

  let prompt = `You are Sherlock, an AI assistant for ${schoolName}. ${roleContext} Be concise, helpful, and professional. You only know what is in the school library documents below. Do not invent features, capabilities, or information about the school that are not explicitly stated in those documents. If the library is empty, say you don't have school-specific information yet and ask the owner to upload documents to the library.`;

  if (language === 'ka') {
    prompt += ' Always respond in Georgian (ქართული) regardless of the language of the documents.';
  }

  if (mode === 'focus') {
    prompt += '\n\nIMPORTANT: Answer ONLY using the school library documents provided below. If the answer is not in the library, say you do not have that information in the school library.';
  } else if (mode === 'smart') {
    prompt += '\n\nUse the school library documents as your primary source. You may also use your general knowledge to supplement answers.';
  } else {
    prompt += '\n\nYou may use both the school library and your full general knowledge to help.';
  }

  if (libraryFiles.length > 0) {
    const fileList = libraryFiles.map(f => `  - ${f.filename} (ID: ${f.id})`).join('\n');
    prompt += '\n\nAvailable library files:\n' + fileList + '\nIf the user asks to download or get a specific file, include [DOWNLOAD:id:filename] in your response, replacing id and filename with the actual values from the list above.';
    const combined = libraryFiles
      .map(f => `=== ${f.filename} ===\n${f.content}`)
      .join('\n\n')
      .slice(0, 20000);
    prompt += `\n\nSCHOOL LIBRARY:\n\n${combined}`;
  }

  return prompt;
}

router.post('/', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!checkRateLimit(user.userId)) {
    return res.status(429).json({ error: 'Too many messages. Please wait before sending more.' });
  }

  const { messages, mode = 'smart', language = 'en' } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const schoolResult = await pool.query(
      'SELECT api_key_encrypted, name FROM schools WHERE id = $1',
      [user.schoolId]
    );
    if (schoolResult.rows.length === 0) {
      return res.status(403).json({ error: 'School not found' });
    }
    const school = schoolResult.rows[0];
    const apiKey = school.api_key_encrypted || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('[chat] No API key for school', user.schoolId, '- env fallback also missing');
      return res.status(402).json({ error: 'No API key configured for this school. Please add your Anthropic API key in settings.' });
    }

    const libraryFiles = await getLibraryContext(user.schoolId);

    const systemPrompt = buildSystemPrompt(
      { ...user, schoolName: school.name || user.schoolName },
      mode,
      libraryFiles,
      language
    );

    // Strip leading assistant messages — Anthropic requires conversation to start with user
    const trimmed = messages.slice(messages.findIndex(m => m.role === 'user'));
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'At least one user message is required' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: trimmed,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(500).json({ error: data.error?.message || 'AI error' });
    }

    const rawReply = data.content?.[0]?.text || 'No response.';
    const reply = rawReply.replace(/\[DOWNLOAD:(\d+):([^\]]+)\]/g, (match, id, name) => {
      return `[📄 ${name}](/api/library/download/${id})`;
    });
    res.json({ message: reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
