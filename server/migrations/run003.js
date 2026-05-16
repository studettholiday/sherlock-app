const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ connectionString: process.env.DATABASE_PUBLIC_URL });
async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '003_school_status.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 003 complete');
  process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
