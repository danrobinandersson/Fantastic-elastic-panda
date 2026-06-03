// Quick DB connectivity check for local debugging
// Usage: from repo root or scoreboard-api folder:
//   node scoreboard-api/check_db.js

require('dotenv').config({ path: './scoreboard-api/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

(async () => {
  try {
    console.log('Testing DB connection...');
    const res = await pool.query('SELECT 1 as ok');
    console.log('DB connected. Query result:', res.rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed:');
    if (err && err.stack) console.error(err.stack);
    else console.error(err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
})();
