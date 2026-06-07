const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// Returns the runtime Paddle config the frontend needs to open Checkout.
// Kept on the server so sandbox→live swap is a Railway env-var change with
// no rebuild. Auth-gated: only signed-in users see token/price ids.
router.get('/config', authMiddleware, (_req, res) => {
  res.json({
    environment: process.env.PADDLE_ENV || 'sandbox',
    token: process.env.PADDLE_CLIENT_TOKEN,
    prices: {
      starter:  process.env.PADDLE_PRICE_STARTER,
      standard: process.env.PADDLE_PRICE_STANDARD,
      pro:      process.env.PADDLE_PRICE_PRO,
    },
  });
});

// Paddle replays older webhooks on transient failures; reject anything more
// than five minutes off our clock so a leaked signature can't be used later.
const MAX_SIG_AGE_MS = 5 * 60 * 1000;

function tierForPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.PADDLE_PRICE_STARTER)  return 'starter';
  if (priceId === process.env.PADDLE_PRICE_STANDARD) return 'standard';
  if (priceId === process.env.PADDLE_PRICE_PRO)      return 'pro';
  return null;
}

// Paddle-Signature: "ts=<unix-seconds>;h1=<hex>". HMAC-SHA256 of `${ts}:${rawBody}`
// keyed by PADDLE_WEBHOOK_SECRET, compared timing-safe.
function verifySignature(header, rawBody, secret) {
  if (typeof header !== 'string' || !header) return false;
  const parts = {};
  for (const seg of header.split(';')) {
    const i = seg.indexOf('=');
    if (i === -1) continue;
    parts[seg.slice(0, i).trim()] = seg.slice(i + 1).trim();
  }
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const tsMs = Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > MAX_SIG_AGE_MS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${ts}:${rawBody}`)
    .digest('hex');

  let a, b;
  try {
    a = Buffer.from(expected, 'hex');
    b = Buffer.from(h1, 'hex');
  } catch {
    return false;
  }
  if (a.length === 0 || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// express.raw is applied at the route level (not router level) so this
// endpoint alone receives the unparsed Buffer needed for HMAC verification.
// The Paddle router is mounted before express.json() in server/index.js to
// keep the global JSON parser from draining the stream before we get here.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[paddle] PADDLE_WEBHOOK_SECRET is not set; rejecting webhook');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const sig = req.headers['paddle-signature'];
  if (!verifySignature(sig, rawBody, secret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventType = event?.event_type;
  const data = event?.data;
  if (!eventType || !data) {
    return res.status(400).json({ error: 'Malformed event' });
  }

  try {
    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const schoolId = data.custom_data?.school_id;
      const priceId = data.items?.[0]?.price?.id;
      const tier = tierForPriceId(priceId);

      if (!schoolId || !tier) {
        console.warn(
          '[paddle] %s skipped — schoolId=%s priceId=%s (tier mapping missing)',
          eventType, schoolId, priceId
        );
      } else {
        await pool.query(
          `UPDATE schools
              SET tier                   = $1,
                  paddle_customer_id     = $2,
                  paddle_subscription_id = $3,
                  subscription_status    = $4
            WHERE id = $5`,
          [tier, data.customer_id || null, data.id || null, data.status || null, schoolId]
        );
      }
    } else if (eventType === 'subscription.canceled') {
      await pool.query(
        `UPDATE schools
            SET tier                = 'trial',
                subscription_status = 'canceled'
          WHERE paddle_subscription_id = $1`,
        [data.id]
      );
    } else if (eventType === 'transaction.completed') {
      console.log(
        '[paddle] transaction.completed id=%s schoolId=%s',
        data.id, data.custom_data?.school_id
      );
    }
  } catch (err) {
    // Swallow DB errors and still 200 — Paddle will otherwise retry the same
    // event for hours. The event_id + our logs are enough to reconcile later.
    console.error('[paddle] handler error for %s:', eventType, err.message);
  }

  res.status(200).json({ ok: true });
});

module.exports = router;
