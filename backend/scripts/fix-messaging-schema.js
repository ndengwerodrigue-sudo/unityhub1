require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db');

async function run() {
  const userCols = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'
       AND column_name IN ('phone', 'whatsapp_opt_in')`
  );
  console.log('Existing user columns:', userCols.rows.map((r) => r.column_name));

  const alters = [
    `CREATE TABLE IF NOT EXISTS user_contact_preferences (
       user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
       phone VARCHAR(50),
       whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ`,
    `ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  ];

  for (const sql of alters) {
    try {
      await db.query(sql);
      console.log('OK:', sql.slice(0, 60));
    } catch (err) {
      console.warn('SKIP:', err.message);
    }
  }

  const tables = await db.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('message_attachments', 'whatsapp_logs', 'conversation_timeline')`
  );
  console.log('Messaging tables:', tables.rows.map((r) => r.table_name));
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
