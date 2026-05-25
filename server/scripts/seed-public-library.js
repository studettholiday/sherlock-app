#!/usr/bin/env node
/**
 * seed-public-library.js — one-off creator for the "Sherlock Public Library"
 * school + its owner user. Idempotent: if a school with is_public_library =
 * true already exists, it logs the existing row and exits without changes.
 *
 * Run manually (e.g. inside Railway's shell after a deploy that ran
 * migration 020):
 *
 *   node server/scripts/seed-public-library.js
 *
 * The owner password comes from the PUBLIC_LIBRARY_PASSWORD env var; if
 * unset, the script prompts interactively (hidden input). Fails loudly if
 * neither is available (e.g. CI without the env var).
 */

const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Try to load .env from server/ regardless of cwd. No-op if absent — Railway
// injects env vars directly.
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) { /* ignore */ }

const SCHOOL_NAME = 'Sherlock Public Library';
const OWNER_EMAIL = 'library@sherlock.school';
const MIN_PWD_LEN = 8;

async function getPassword() {
  const envPwd = process.env.PUBLIC_LIBRARY_PASSWORD;
  if (envPwd) {
    if (envPwd.length < MIN_PWD_LEN) {
      throw new Error(`PUBLIC_LIBRARY_PASSWORD must be at least ${MIN_PWD_LEN} characters`);
    }
    return envPwd;
  }
  if (!process.stdin.isTTY) {
    throw new Error(
      'PUBLIC_LIBRARY_PASSWORD env var not set and stdin is not a TTY — cannot prompt for a password. Set the env var and re-run.'
    );
  }
  return promptHidden(`Password for ${OWNER_EMAIL}: `);
}

// Hidden interactive prompt — reads keypresses in raw mode so the password
// doesn't echo to the terminal. Supports backspace, Ctrl-C cancel, Enter to
// submit.
function promptHidden(promptText) {
  return new Promise((resolve, reject) => {
    process.stdout.write(promptText);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let pwd = '';
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        if (pwd.length < MIN_PWD_LEN) reject(new Error(`Password must be at least ${MIN_PWD_LEN} characters`));
        else resolve(pwd);
      } else if (ch === '') { // Ctrl-C
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        reject(new Error('Cancelled'));
      } else if (ch === '' || ch === '\b') { // Backspace
        if (pwd.length > 0) {
          pwd = pwd.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        pwd += ch;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_PUBLIC_URL;
  if (!dbUrl) {
    console.error('DATABASE_PUBLIC_URL not set — cannot connect to DB.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  try {
    // Idempotency: bail if a public-library school already exists.
    const existing = await pool.query(
      'SELECT id, name FROM schools WHERE is_public_library = true LIMIT 1'
    );
    if (existing.rows.length > 0) {
      console.log('A public library school already exists:');
      console.log(`  school_id: ${existing.rows[0].id}`);
      console.log(`  name:      ${existing.rows[0].name}`);
      console.log('No changes made.');
      return;
    }

    const password = await getPassword();
    const hash = await bcrypt.hash(password, 10);

    // Create school + owner in one transaction so a duplicate-email user
    // failure can't leave an orphan school row behind.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const schoolRes = await client.query(
        `INSERT INTO schools (name, status, approved_at, is_public_library, student_ai_enabled, student_downloads_enabled)
         VALUES ($1, 'approved', NOW(), true, false, false)
         RETURNING id`,
        [SCHOOL_NAME]
      );
      const schoolId = schoolRes.rows[0].id;

      // role='student' is the only value allowed by the post-012 check
      // constraint; is_owner=true distinguishes ownership.
      await client.query(
        `INSERT INTO users (school_id, email, password_hash, role, name, is_owner)
         VALUES ($1, $2, $3, 'student', $4, true)`,
        [schoolId, OWNER_EMAIL, hash, 'library']
      );
      await client.query('COMMIT');

      console.log('\nPublic library school created:');
      console.log(`  school_id: ${schoolId}`);
      console.log(`  login:     ${OWNER_EMAIL}`);
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
