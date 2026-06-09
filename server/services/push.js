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

// Long-lived pool reused by every send path (the per-write notifyScheduleChange
// AND the 60-second reminderLoop tick). Never .end() in this module — the loop
// expects it to outlive every individual call.
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

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

// Shared sender — fans the same payload out to every subscription row and
// prunes dead endpoints (HTTP 410/404) inline. Best-effort: per-send errors
// are logged but never re-thrown.
async function sendToSubscriptions(subRows, payloadObj) {
  if (!subRows || subRows.length === 0) return;
  const payload = JSON.stringify(payloadObj);
  await Promise.all(subRows.map(async (sub) => {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
    };
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
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
}

// Broadcast a schedule change to every push subscription in a school.
// Best-effort: all DB + send work is wrapped so it can never reject into the
// caller. Dead subscriptions are pruned by sendToSubscriptions.
async function notifyScheduleChange(schoolId, action, scheduleRow) {
  if (!pushEnabled) return;
  try {
    // Target: every owner of the school (owners always get all notifications)
    // plus every student assigned to the changed class.
    const className = scheduleRow && scheduleRow.class_name ? scheduleRow.class_name : null;
    const { rows } = await pool.query(
      `SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh_key, ps.auth_key
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
    await sendToSubscriptions(rows, buildPayload(action, scheduleRow));
  } catch (err) {
    console.error('[push] notifyScheduleChange error:', err.message);
  }
}

// Lesson-reminder fan-out. Audience: students assigned to scheduleRow's
// class_name (NOT owners — owners aren't woken up an hour before every lesson).
// Georgian wall-clock copy keyed off lesson_time's first 5 chars; URL stays
// /chat so tapping the notification drops the student into the app where the
// schedule panel is visible.
async function notifyLessonReminder(scheduleRow) {
  if (!pushEnabled) return;
  try {
    const className = scheduleRow.class_name || '';
    const schoolId  = scheduleRow.school_id;
    const time      = (scheduleRow.lesson_time || '').slice(0, 5);
    const roomSuffix = scheduleRow.room ? `, ${scheduleRow.room}` : '';
    const payloadObj = {
      title: '🔔 გაკვეთილის შეხსენება',
      body:  `${className} იწყება ${time}-ზე${roomSuffix}`,
      url:   APP_URL,
    };
    const { rows } = await pool.query(
      `SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh_key, ps.auth_key
       FROM push_subscriptions ps
       WHERE ps.school_id = $1
         AND ps.user_id IN (
           SELECT user_id FROM student_classes
             WHERE school_id = $1 AND class_name = $2
         )`,
      [schoolId, className]
    );
    await sendToSubscriptions(rows, payloadObj);
  } catch (err) {
    console.error('[push] notifyLessonReminder error:', err.message);
  }
}

module.exports = { notifyScheduleChange, notifyLessonReminder, pushEnabled };
