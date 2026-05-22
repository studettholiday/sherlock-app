// Web Push (VAPID) service.
//
// Holds the one-time webpush VAPID configuration and the broadcast helper
// notifyScheduleChange(). Push is a best-effort side channel: it must never
// crash the server or block a schedule write. If the VAPID env vars are
// missing the whole module degrades to a no-op.
//
// One-time key generation (run locally, paste results into Railway env vars):
//   npx web-push generate-vapid-keys
// Required env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

const webpush = require('web-push');
const { Pool } = require('pg');

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

// Configure webpush once at module load. pushEnabled gates every send.
let pushEnabled = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    pushEnabled = true;
    console.log('[push] VAPID configured — push notifications enabled');
  } catch (err) {
    console.warn('[push] VAPID configuration failed — push disabled:', err.message);
  }
} else {
  console.warn('[push] VAPID keys missing — push notifications disabled');
}

const APP_URL = 'https://app.sherlock.school/chat';

// schedule.day_of_week is stored numerically (0 = Monday). Map it to a name;
// fall back to the raw value for anything outside 0–6.
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function dayName(d) {
  if (d === null || d === undefined || d === '') return '';
  const n = Number(d);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? DAY_NAMES[n] : String(d);
}

// Build the notification payload for a schedule action. scheduleRow is the
// affected schedule row (RETURNING * from the POST/PATCH/DELETE query).
function buildPayload(action, scheduleRow) {
  const day = dayName(scheduleRow?.day_of_week);
  const time = scheduleRow?.lesson_time || '';
  const cls = scheduleRow?.class_name || 'Class';
  const COPY = {
    POST:   { title: 'Schedule updated', verb: 'added' },
    PATCH:  { title: 'Schedule changed', verb: 'updated' },
    DELETE: { title: 'Class cancelled',  verb: 'removed' },
  };
  const c = COPY[action] || COPY.POST;
  const body = `${day} ${time} — ${cls} ${c.verb}`.replace(/\s+/g, ' ').trim();
  return { title: c.title, body, url: APP_URL };
}

// Broadcast a schedule change to every push subscription in a school.
// Best-effort: all DB + send work is wrapped so it can never reject into the
// caller. Dead subscriptions (HTTP 404/410) are pruned inline.
async function notifyScheduleChange(schoolId, action, scheduleRow) {
  if (!pushEnabled) return;
  let pool;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
    // Target: every owner of the school (owners always get all notifications)
    // plus every student assigned to the changed class.
    const className = scheduleRow && scheduleRow.class_name ? scheduleRow.class_name : null;
    const { rows } = await pool.query(
      `SELECT ps.id, ps.endpoint, ps.p256dh_key, ps.auth_key
       FROM push_subscriptions ps
       WHERE ps.school_id = $1
         AND ps.user_id IN (
           SELECT id FROM users WHERE school_id = $1 AND is_owner = true
           UNION
           SELECT user_id FROM student_classes
             WHERE school_id = $1 AND class_name = $2
         )`,
      [schoolId, className]
    );
    if (rows.length === 0) return;

    const payload = JSON.stringify(buildPayload(action, scheduleRow));

    await Promise.all(rows.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
      };
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription is dead — remove it so we stop trying.
          try {
            await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
          } catch (delErr) {
            console.error('[push] failed to prune dead subscription:', delErr.message);
          }
        } else {
          console.error('[push] sendNotification failed:', err.statusCode, err.message);
        }
      }
    }));
  } catch (err) {
    console.error('[push] notifyScheduleChange error:', err.message);
  } finally {
    if (pool) {
      try { await pool.end(); } catch (_) { /* ignore */ }
    }
  }
}

module.exports = { notifyScheduleChange, pushEnabled };
