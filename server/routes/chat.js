const express = require('express');
const router = express.Router();
const fs = require('fs');
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
      'SELECT filename, file_path, mime_type FROM library_files WHERE school_id = $1',
      [schoolId]
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
        console.error('Error reading library file:', file.filename, e.message);
      }
    }
    return contents;
  } catch (err) {
    console.error('Library fetch error:', err.message);
    return [];
  }
}

function buildSystemPrompt(user, mode, libraryFiles, language) {
  const role = user.role;
  const schoolName = user.schoolName;

  const roleContext = {
    admin:     `You are assisting ${schoolName}'s admin. You have full access to help manage the school.`,
    assistant: `You are assisting ${schoolName}'s office assistant.`,
    teacher:   `You are assisting a teacher at ${schoolName}.`,
    student:   `You are assisting a student at ${schoolName}.`,
  }[role] || `You are assisting a member of ${schoolName}.`;

  let prompt = `You are Sherlock, an AI assistant for ${schoolName}. ${roleContext} Be concise, helpful, and professional.`;

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
      'SELECT api_key_encrypted, chat_mode_ceiling, name FROM schools WHERE id = $1',
      [user.schoolId]
    );
    if (schoolResult.rows.length === 0) {
      return res.status(403).json({ error: 'School not found' });
    }
    const school = schoolResult.rows[0];
    const apiKey = school.api_key_encrypted;

    // Enforce mode ceiling set by admin
    const modeRank = { focus: 0, smart: 1, full: 2 };
    const ceiling = school.chat_mode_ceiling || 'full';
    const effectiveMode = (modeRank[mode] ?? 1) <= (modeRank[ceiling] ?? 2) ? mode : ceiling;

    if (!apiKey) {
      return res.status(402).json({ error: 'No API key configured for this school. Please add your Anthropic API key in settings.' });
    }

    const libraryFiles = await getLibraryContext(user.schoolId);

    const systemPrompt = buildSystemPrompt(
      { ...user, schoolName: school.name || user.schoolName },
      effectiveMode,
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
        model: 'claude-sonnet-4-20250514',
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

    const reply = data.content?.[0]?.text || 'No response.';
    res.json({ message: reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
