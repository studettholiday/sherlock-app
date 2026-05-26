#!/usr/bin/env node
/**
 * fix-filename-encoding.js — one-shot repair for double-encoded library_files
 * filenames. Pre-fix uploads passed multer's Latin-1-decoded originalname
 * straight into Postgres, producing mojibake like "KÃ¶hler.pdf" for any
 * non-ASCII byte. Reverses the encoding using Postgres's convert_to/convert_from
 * pair, inside a transaction guarded by a confirmation prompt.
 *
 * Usage:
 *   node server/scripts/fix-filename-encoding.js          # preview + prompt
 *   node server/scripts/fix-filename-encoding.js --yes    # skip prompt
 *
 * Idempotent: matches only rows whose filename contains 'Ã' (the c3 byte
 * signature of UTF-8-mistaken-as-Latin-1). Safe to re-run.
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
    await client.query('BEGIN');

    // Pair each candidate row with its corrected filename so the operator can
    // eyeball the change before COMMIT. convert_to(..., 'LATIN1') throws if
    // any character is outside Latin-1 — in that case the whole SELECT bails,
    // ROLLBACK runs, and the operator investigates manually.
    const preview = await client.query(`
      SELECT id, filename AS before_name,
             convert_from(convert_to(filename, 'LATIN1'), 'UTF8') AS after_name
      FROM library_files
      WHERE filename LIKE '%Ã%'
      ORDER BY id
    `);

    if (preview.rows.length === 0) {
      console.log('No rows match the mojibake signature. Nothing to do.');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`Found ${preview.rows.length} candidate row(s):\n`);
    for (const r of preview.rows) {
      console.log(`  id=${r.id}`);
      console.log(`    before: ${r.before_name}`);
      console.log(`    after : ${r.after_name}`);
    }
    console.log('');

    if (!AUTO_CONFIRM) {
      const ok = await promptYesNo('Apply these updates? [y/N] ');
      if (!ok) {
        console.log('Cancelled. No changes made.');
        await client.query('ROLLBACK');
        return;
      }
    }

    const result = await client.query(`
      UPDATE library_files
      SET filename = convert_from(convert_to(filename, 'LATIN1'), 'UTF8')
      WHERE filename LIKE '%Ã%'
    `);
    await client.query('COMMIT');
    console.log(`Updated ${result.rowCount} row(s).`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fix failed:', err.message);
  process.exit(1);
});
