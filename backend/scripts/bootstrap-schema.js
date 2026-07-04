require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { query } = require('../db');

const INIT_FILES = [
  'init_users.sql',
  'init_posts.sql',
  'init_opportunities.sql',
  'init_businesses.sql',
  'init_events.sql',
  'init_notifications.sql',
];

async function tableExists(tableName) {
  const result = await query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName]
  );
  return !!result.rows[0]?.exists;
}

async function bootstrapSchema() {
  const sqlDir = path.join(__dirname, '..', 'sql');
  const wasEmpty = !(await tableExists('users'));

  try {
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  } catch (err) {
    console.warn('pgcrypto extension (optional):', err.message);
  }

  for (const file of INIT_FILES) {
    const filePath = path.join(sqlDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Bootstrap skip missing file: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8').trim();
    if (!sql) continue;
    await query(sql);
    console.log(`Schema bootstrap: ${file}`);
  }

  if (wasEmpty) {
    console.log('Base database schema initialized (fresh database)');
  } else {
    console.log('Base database schema verified');
  }
}

module.exports = { bootstrapSchema };

if (require.main === module) {
  bootstrapSchema()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Bootstrap failed:', err.message);
      process.exit(1);
    });
}
