const { Pool } = require('pg');

// DATABASE_URL may be overridden by a stale manual variable; fall back to the
// plugin-injected public URL if it doesn't look like a valid connection string.
function resolveConnectionString() {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith('postgresql://') || url.startsWith('postgres://'))) return url;
  return process.env.DATABASE_PUBLIC_URL;
}

const pool = new Pool({
  connectionString: resolveConnectionString(),
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
