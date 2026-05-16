const express = require('express');
const router = express.Router();
const { routeToProvider } = require('../services/ai');
const pool = require('../services/db');

const MAX_MESSAGES_PER_HOUR = 10;
const MAX_MESSAGE_LENGTH = 500;
const WINDOW_MS = 60 * 60 * 1000;

// { ip -> { count, resetAt } }
const rateLimitStore = new Map();

// Prune expired entries every hour so the map doesn't grow unboundedly
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now >= entry.resetAt) rateLimitStore.delete(ip);
  }
}, WINDOW_MS);

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_MESSAGES_PER_HOUR) return false;

  entry.count += 1;
  return true;
}

router.post('/', async (req, res) => {
  const ip = req.ip;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { messages, provider = 'anthropic', context, language = 'en' } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const lastUser = messages.findLast((m) => m.role === 'user');
  if (lastUser && typeof lastUser.content === 'string' && lastUser.content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.` });
  }

  // Anthropic requires the conversation to start with a user message.
  // Strip any leading assistant turns (e.g. the client's greeting bubble).
  const trimmed = messages.slice(
    messages.findIndex((m) => m.role === 'user')
  );

  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'At least one user message is required' });
  }

  // Build context prefix: library first, then any uploaded document
  let contextPrefix = '';

  try {
    const libResult = await pool.query(
      'SELECT filename, content FROM knowledge_library ORDER BY uploaded_at DESC'
    );
    if (libResult.rows.length > 0) {
      let combined = libResult.rows
        .map(r => `=== ${r.filename} ===\n${r.content}`)
        .join('\n\n');
      if (combined.length > 12000) combined = combined.slice(0, 12000);
      if (language === 'ka') {
        contextPrefix += `შემდეგი არის სკოლის ბიბლიოთეკის შინაარსი. შესაძლოა ინგლისურ ენაზე იყოს. შენ ᲐᲣᲪᲘᲚᲔᲑᲚᲐᲓ უნდა წაიკითხო, გაიგო და კითხვებზე პასუხი გასცე მხოლოდ ქართულ ენაზე. არ დაუბრუნო მომხმარებელს ინგლისური ტექსტი — ყველაფერი თარგმნე ქართულად პასუხის გაცემამდე.\n\nბიბლიოთეკის შინაარსი:\n\n${combined}\n\n---\n\n`;
      } else {
        contextPrefix += `SCHOOL KNOWLEDGE LIBRARY (always use this to answer questions):\n\n${combined}\n\n---\n\n`;
      }
    }
  } catch (err) {
    console.error('Library fetch error:', err.message);
  }

  if (context && typeof context === 'string' && context.trim()) {
    const docContent = context.slice(0, 8000);
    if (language === 'ka') {
      contextPrefix += `მომხმარებელმა ატვირთა დოკუმენტი. შესაძლოა ინგლისურ ენაზე იყოს. შენ ᲐᲣᲪᲘᲚᲔᲑᲚᲐᲓ უნდა წაიკითხო, გაიგო და კითხვებზე პასუხი გასცე მხოლოდ ქართულ ენაზე. არ დაუბრუნო მომხმარებელს ინგლისური ტექსტი — ყველაფერი თარგმნე ქართულად პასუხის გაცემამდე.\n\nდოკუმენტის შინაარსი:\n\n${docContent}\n\nუპასუხე კითხვებს ამ დოკუმენტის საფუძველზე. თუ კითხვა არ ეხება დოკუმენტს, ნათლად აცნობე ამის შესახებ.\n\n---\n\n`;
    } else {
      contextPrefix += `The user has uploaded a document. Use this as your knowledge base to answer questions:\n\n${docContent}\n\nAnswer questions based on this document. If the question is not covered in the document, say so clearly.\n\n---\n\n`;
    }
  }

  let processedMessages = trimmed;
  if (contextPrefix) {
    processedMessages = trimmed.map((msg, i) =>
      i === 0 ? { ...msg, content: contextPrefix + msg.content } : msg
    );
  }

  try {
    const reply = await routeToProvider(provider, processedMessages, language);
    res.json({ message: reply });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
