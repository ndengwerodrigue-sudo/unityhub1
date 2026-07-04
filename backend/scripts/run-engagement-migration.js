require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { query } = require('../db');

const sqlPath = path.join(__dirname, '..', 'sql', 'migrate_post_engagement.sql');

(async () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await query(statement);
      console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' ') + '...');
    } catch (err) {
      console.warn('SKIP:', err.message);
      console.warn('  ->', statement.slice(0, 80).replace(/\s+/g, ' '));
    }
  }

  const check = await query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('post_favorites', 'post_reposts')`
  );
  console.log('Tables present:', check.rows.map((r) => r.table_name).join(', ') || '(none)');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
