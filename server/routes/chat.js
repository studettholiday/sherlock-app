const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');
const trialGate = require('../middleware/trialGate');
const { isTrialExpired } = trialGate;

const TIER_LIMITS = {
  trial:    30,
  starter:  200,
  standard: 700,
  pro:      2000,
};

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

function buildSystemPrompt(user, mode, libraryFiles, language, context) {
  const schoolName = user.schoolName;

  const roleContext = user.is_owner === true
    ? `You are assisting the owner and teacher of ${schoolName}, who runs the school and teaches students. Treat them as the administrator and educator — never address them as a student.`
    : `You are assisting a student at ${schoolName}.`;

  let prompt = `You are Sherlock, an AI assistant for ${schoolName}. ${roleContext} Be concise, helpful, and professional. You only know what is in the school library documents below. Do not invent features, capabilities, or information about the school that are not explicitly stated in those documents. If the library is empty, say you don't have school-specific information yet and ask the owner to upload documents to the library.`;

  prompt += " Respond in the same language the user writes their message in. If they write in English, respond in English; if they write in Georgian, respond in Georgian. Keep the body of your response in that language consistently. You may use words or short phrases from other languages when they serve a clear teaching purpose — defining a term, quoting an example, explaining grammar, or using standard musical or technical vocabulary (such as Italian tempo markings or Latin terms). Do not insert phrases from other languages decoratively, for flavour, or as catchphrases. Every cross-language insertion must have a clear educational reason.";

  prompt += `\n\nInformation sources and accuracy:\n- When the user has attached files for this conversation, treat those attachments as the PRIMARY source. The school library is secondary — only reference it if it is directly relevant to the question or the user explicitly asks about it. When attachments and library overlap, the attached files take precedence.\n- Never fabricate. If asked about a person, fact, or detail that is not present in the attached files, the school library, or something the user has stated, say so clearly: "I don't have that information." Do not guess. Do not invent context to fit the school. Truth over confidence.\n- Do not confuse roles, identities, or relationships. If the library mentions someone, state only what the library actually says — do not infer titles, founders, family ties, or other attributes that are not explicitly stated.`;

  prompt += `\n\nPricing, terms, and privacy: If the user asks about Sherlock's pricing, plans, Terms of Service, or Privacy Policy, do not answer from memory. Direct them to the canonical pages — /pricing for pricing and plans, /terms for the Terms of Service, /privacy for the Privacy Policy.`;

  if (mode === 'focus') {
    prompt += '\n\nIMPORTANT: Answer ONLY using the school library documents provided below. If the answer is not in the library, say you do not have that information in the school library.';
  } else if (mode === 'smart') {
    prompt += '\n\nUse the school library documents as your primary source. You may also use your general knowledge to supplement answers.';
  } else {
    prompt += '\n\nYou may use both the school library and your full general knowledge to help.';
  }

  if (context) {
    prompt += `\n\nATTACHED FILES (chat-scoped, primary source):\n\n${context}`;
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

router.get('/quota', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tier, conversation_count, month_reset_at, created_at FROM schools WHERE id = $1`,
      [req.user.schoolId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'School not found' });
    const s = result.rows[0];
    const limit = TIER_LIMITS[s.tier] ?? TIER_LIMITS.trial;
    const resetPassed = !s.month_reset_at ||
      (Date.now() - new Date(s.month_reset_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
    const count = resetPassed ? 0 : (s.conversation_count ?? 0);
    res.json({
      tier: s.tier ?? 'trial',
      count,
      limit,
      trial_expired: isTrialExpired(s.tier, s.created_at),
    });
  } catch (err) {
    console.error('[quota] error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, trialGate, async (req, res) => {
  const user = req.user;

  // Student AI gate: owners are always allowed; students only if the school
  // has student_ai_enabled = true. Per-request DB read (not JWT-baked) so a
  // student doesn't need to re-login to feel an owner toggle.
  if (!user.is_owner) {
    try {
      const r = await pool.query('SELECT student_ai_enabled FROM schools WHERE id = $1', [user.schoolId]);
      if (!r.rows[0] || r.rows[0].student_ai_enabled !== true) {
        return res.status(403).json({ error: 'AI chat is disabled for students at this school.' });
      }
    } catch (err) {
      console.error('[chat] student AI gate check error:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (!checkRateLimit(user.userId)) {
    return res.status(429).json({ error: 'Too many messages. Please wait before sending more.' });
  }

  const { messages, mode = 'smart', language = 'en', context } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const schoolResult = await pool.query(
      `SELECT id, api_key_encrypted, name,
              tier, conversation_count, month_reset_at
       FROM schools WHERE id = $1`,
      [user.schoolId]
    );
    if (schoolResult.rows.length === 0) {
      return res.status(403).json({ error: 'School not found' });
    }
    const school = schoolResult.rows[0];

    // --- metering: quota check ---
    const _tierLimit = TIER_LIMITS[school.tier] ?? TIER_LIMITS.trial;
    const _resetPassed = !school.month_reset_at ||
      (Date.now() - new Date(school.month_reset_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
    const _effectiveCount = _resetPassed ? 0 : (school.conversation_count ?? 0);
    if (_effectiveCount >= _tierLimit) {
      const _limitMsg = req.body.language === 'ka'
        ? 'AI ჩატის ყოველთვიური ლიმიტი ამოწურულია. ყველა სხვა ფუნქცია ხელმისაწვდომია. ლიმიტი განახლდება ~30 დღეში.'
        : 'Monthly AI conversation limit reached. All other features remain available. Resets in ~30 days.';
      return res.status(429).json({ error: _limitMsg, quota_exceeded: true });
    }
    // TODO: race condition — two concurrent requests near the limit may both
    // pass this check. Acceptable for Phase 1 (single-school low concurrency).
    // Fix in Phase 2 with atomic increment-or-reject SQL.
    // --- end quota check ---

    const apiKey = school.api_key_encrypted || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('[chat] No API key for school - env fallback also missing');
      return res.status(402).json({ error: 'No API key configured for this school. Please add your Anthropic API key in settings.' });
    }

    const libraryFiles = await getLibraryContext(user.schoolId);

    const systemPrompt = buildSystemPrompt(
      { ...user, schoolName: school.name || user.schoolName },
      mode,
      libraryFiles,
      language,
      context
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
        model: 'claude-sonnet-4-6',
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

    // --- metering: record usage on success only ---
    const _usage = data.usage ?? {};
    const _inputTok  = _usage.input_tokens  ?? 0;
    const _outputTok = _usage.output_tokens ?? 0;
    try {
      await pool.query(
        `UPDATE schools
         SET conversation_count  = CASE WHEN COALESCE(month_reset_at, '2000-01-01') + INTERVAL '30 days' < NOW()
                                        THEN 1 ELSE conversation_count + 1 END,
             input_tokens_month  = CASE WHEN COALESCE(month_reset_at, '2000-01-01') + INTERVAL '30 days' < NOW()
                                        THEN $2 ELSE input_tokens_month  + $2 END,
             output_tokens_month = CASE WHEN COALESCE(month_reset_at, '2000-01-01') + INTERVAL '30 days' < NOW()
                                        THEN $3 ELSE output_tokens_month + $3 END,
             month_reset_at      = CASE WHEN COALESCE(month_reset_at, '2000-01-01') + INTERVAL '30 days' < NOW()
                                        THEN NOW() ELSE month_reset_at END
         WHERE id = $1`,
        [school.id, _inputTok, _outputTok]
      );
    } catch (_err) {
      console.error('[metering] record failed (non-fatal):', _err.message);
    }
    // --- end record usage ---

    res.json({ message: reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
