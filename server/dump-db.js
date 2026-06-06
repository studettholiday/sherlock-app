const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: 'postgresql://postgres:SwdYcuAlKXDPDqyvHcVTboKNlSZewQRX@tramway.proxy.rlwy.net:57985/railway'
});
(async () => {
  const dir = `${process.env.HOME}/sherlock-backups/sherlock-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}`;
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Folder: ${dir}\n`);
  try {
    const tablesRes = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    let ok = 0, fail = 0;
    for (const { table_name } of tablesRes.rows) {
      try {
        const r = await pool.query(`SELECT * FROM "${table_name}"`);
        fs.writeFileSync(`${dir}/${table_name}.json`, JSON.stringify(r.rows, null, 2));
        console.log(`  OK   ${table_name}: ${r.rows.length} rows`);
        ok++;
      } catch (err) {
        console.log(`  FAIL ${table_name}: ${err.message}`);
        fail++;
      }
    }
    console.log(`\n${ok} tables saved, ${fail} failed`);
    console.log(`Folder: ${dir}`);
  } catch (err) {
    console.error('Fatal:', err.message);
  } finally {
    await pool.end();
  }
})();
