// Lesson-reminder background loop. Wakes every 60s, pushes a notification
// REMINDER_MINUTES before each scheduled lesson.
//
// Tbilisi-fixed: lessons are wall-clock times in Asia/Tbilisi (UTC+4, no DST).
// We hard-code the offset rather than carry a tz library or a per-school
// column — the customer base is single-region for the foreseeable future.
//
// day_of_week convention: 0 = Monday (see services/push.js:33). JS
// Date#getUTCDay() is 0 = Sunday, so we shift by 6 to land in the app's
// numbering.
//
// Dedupe: schedule.last_reminder_sent_at (TIMESTAMPTZ; migration 028). A row
// fires at most once per Tbilisi calendar day, even though the 60-second tick
// over a 2-minute firing window means we may match the same row on two
// adjacent ticks.

const { Pool } = require('pg');
const { notifyLessonReminder, pushEnabled } = require('./push');

const REMINDER_MINUTES = 60;
const TICK_MS = 60 * 1000;
const TBILISI_OFFSET_MS = 4 * 60 * 60 * 1000;

const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });

// Returns { appDay, nowMinutes, tbilisiYMD } for the current instant.
// appDay uses the codebase's 0 = Monday encoding, NOT Date's 0 = Sunday.
function tbilisiClock() {
  const t = new Date(Date.now() + TBILISI_OFFSET_MS);
  const appDay = (t.getUTCDay() + 6) % 7;
  const nowMinutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  const tbilisiYMD = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
  return { appDay, nowMinutes, tbilisiYMD };
}

// Tbilisi calendar date of an arbitrary UTC instant as YYYY-MM-DD.
function tbilisiYMDOf(date) {
  const t = new Date(date.getTime() + TBILISI_OFFSET_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// schedule.lesson_time is VARCHAR(20) free-text. Accept HH:MM optionally
// followed by anything; return total minutes-since-midnight, or null if the
// string can't be made sense of (caller skips the row).
function parseLessonMinutes(lessonTime) {
  if (!lessonTime) return null;
  const m = String(lessonTime).match(/^\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

async function tick() {
  try {
    const { appDay, nowMinutes, tbilisiYMD } = tbilisiClock();
    const { rows } = await pool.query(
      `SELECT id, school_id, class_name, lesson_time, room, last_reminder_sent_at
       FROM schedule
       WHERE day_of_week = $1`,
      [String(appDay)]
    );
    for (const row of rows) {
      try {
        const lessonMinutes = parseLessonMinutes(row.lesson_time);
        if (lessonMinutes === null) continue;
        const minutesUntil = lessonMinutes - nowMinutes;
        // Firing window: (REMINDER_MINUTES - 2, REMINDER_MINUTES]. Two-minute
        // span ensures a row is caught even if a tick is delayed; the dedupe
        // below prevents double-sends.
        if (!(minutesUntil <= REMINDER_MINUTES && minutesUntil > REMINDER_MINUTES - 2)) continue;
        if (row.last_reminder_sent_at &&
            tbilisiYMDOf(new Date(row.last_reminder_sent_at)) === tbilisiYMD) continue;
        await notifyLessonReminder(row);
        await pool.query(
          'UPDATE schedule SET last_reminder_sent_at = NOW() WHERE id = $1',
          [row.id]
        );
      } catch (rowErr) {
        console.error('[reminderLoop] row error (non-fatal):', rowErr.message);
      }
    }
  } catch (err) {
    console.error('[reminderLoop] tick error (non-fatal):', err.message);
  }
}

function start() {
  if (!pushEnabled) {
    console.log('[reminderLoop] push disabled — reminder loop not started');
    return;
  }
  console.log(`[reminderLoop] started — tick every ${TICK_MS / 1000}s, fire ${REMINDER_MINUTES}m before lesson (Tbilisi)`);
  setInterval(tick, TICK_MS);
}

module.exports = { start };
