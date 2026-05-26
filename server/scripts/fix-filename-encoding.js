#!/usr/bin/env node
/**
 * fix-filename-encoding.js — one-shot repair for double-encoded library_files
 * filenames. Pre-fix uploads passed multer's Latin-1-decoded originalname
 * straight into Postgres, producing mojibake whose exact form depends on the
 * original character: "Köhler" → "KÃ¶hler" (Ã prefix), em-dash bytes "— " →
 * "â<80><94>" (â prefix + control bytes), smart quotes similar.
 *
 * Detection works by re-running the original corruption in reverse: encode the
 * stored string's codepoints as Latin-1, decode the resulting bytes as UTF-8.
 * For genuine mojibake this produces the real filename. For an already-correct
 * filename the round-trip either equals the original (pure ASCII) or produces
 * U+FFFD replacement chars (because correctly-encoded chars like "ö" become
 * single Latin-1 byte 0xF6, which isn't a valid UTF-8 start byte). Both cases
 * are skipped, so the script is safe to re-run.
 *
 * Done in JS rather than SQL because Postgres convert_from raises an error on
 * invalid UTF-8 sequences — it would crash the SELECT the moment any
 * correctly-encoded row exists in the table.
 *
 * Usage:
 *   node server/scripts/fix-filename-encoding.js          # preview + prompt
 *   node server/scripts/fix-filename-encoding.js --yes    # skip prompt
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

    // Pre-filter: only rows containing any Latin-1 supplement codepoint
    // (U+0080–U+00FF). Mojibake always produces codepoints in that range, and
    // pure-ASCII filenames can't be mojibake'd at all.
    const rows = await client.query(`
      SELECT id, filename
      FROM library_files
      WHERE filename ~ '[\\x80-\\xff]'
      ORDER BY id
    `);

    const candidates = [];
    for (const r of rows.rows) {
      const decoded = Buffer.from(r.filename, 'latin1').toString('utf8');
      if (decoded === r.filename) continue;        // unchanged → not mojibake
      if (decoded.includes('�')) continue;    // invalid UTF-8 → already correct
      candidates.push({ id: r.id, before: r.filename, after: decoded });
    }

    if (candidates.length === 0) {
      console.log('No mojibake rows found. Nothing to do.');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`Found ${candidates.length} candidate row(s):\n`);
    for (const c of candidates) {
      console.log(`  id=${c.id}`);
      console.log(`    before: ${c.before}`);
      console.log(`    after : ${c.after}`);
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

    for (const c of candidates) {
      await client.query(
        'UPDATE library_files SET filename = $1 WHERE id = $2',
        [c.after, c.id]
      );
    }
    await client.query('COMMIT');
    console.log(`Updated ${candidates.length} row(s).`);
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
