#!/usr/bin/env node
/**
 * cleanup-deleted.js — hard-deletes soft-deleted schools and users past the
 * 21-day grace period. Manual; not wired into any scheduler.
 *
 * Pre-queries candidates and prints a preview before doing anything
 * destructive. Prompts y/N unless --yes is passed. Wraps the DELETEs in a
 * single transaction so a mid-run failure rolls back cleanly.
 *
 * Order matters: schools first so users / library / schedule / push subs all
 * cascade out, then sweep up standalone-student deletions.
 *
 * Usage:
 *   railway run node server/scripts/cleanup-deleted.js          # preview + prompt
 *   railway run node server/scripts/cleanup-deleted.js --yes    # skip prompt
 */

const path = require('path');
const { Pool } = require('pg');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) { /* ignore */ }

const AUTO_CONFIRM = process.argv.includes('--yes');

function promptYesNo(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      process.stdin.pause();
      resolve(/^y(es)?$/i.test(data.trim()));
    });
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_PUBLIC_URL;
  if (!dbUrl) {
    console.error('DATABASE_PUBLIC_URL not set — cannot connect.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();
  try {
    const schoolCandidates = await client.query(
      "SELECT id, name, deleted_at FROM schools WHERE deleted_at < NOW() - INTERVAL '21 days' ORDER BY id"
    );
    const userCandidates = await client.query(
      "SELECT id, email, deleted_at FROM users WHERE deleted_at < NOW() - INTERVAL '21 days' ORDER BY id"
    );

    if (schoolCandidates.rows.length === 0 && userCandidates.rows.length === 0) {
      console.log('Nothing to clean up.');
      return;
    }

    if (schoolCandidates.rows.length > 0) {
      console.log(`Schools to hard-delete (${schoolCandidates.rows.length}) — all related rows cascaded:`);
      for (const s of schoolCandidates.rows) {
        console.log(`  id=${s.id}  deleted_at=${s.deleted_at.toISOString()}  name=${s.name}`);
      }
      console.log('');
    }
    if (userCandidates.rows.length > 0) {
      console.log(`Standalone users to hard-delete (${userCandidates.rows.length}):`);
      for (const u of userCandidates.rows) {
        console.log(`  id=${u.id}  deleted_at=${u.deleted_at.toISOString()}  email=${u.email}`);
      }
      console.log('');
    }

    if (!AUTO_CONFIRM) {
      const ok = await promptYesNo('Apply deletes? [y/N] ');
      if (!ok) {
        console.log('Cancelled. No changes made.');
        return;
      }
    }

    await client.query('BEGIN');
    const schools = await client.query(
      "DELETE FROM schools WHERE deleted_at < NOW() - INTERVAL '21 days' RETURNING id"
    );
    const users = await client.query(
      "DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '21 days' RETURNING id"
    );
    await client.query('COMMIT');
    console.log(`[cleanup] hard-deleted ${schools.rowCount} school(s) (all related rows cascaded)`);
    console.log(`[cleanup] hard-deleted ${users.rowCount} standalone user(s)`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
