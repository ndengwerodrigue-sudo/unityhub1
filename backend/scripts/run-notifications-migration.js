const { query } = require('../db');

async function runNotificationsMigration() {
  const col = await query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'user_id'
  `);

  if (col.rows[0]?.data_type === 'integer') {
    console.log('Recreating notifications table (user_id was INTEGER, expected UUID)...');
    await query('DROP TABLE IF EXISTS notifications CASCADE');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(255),
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

  await query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');

  console.log('Notifications table ready');
}

if (require.main === module) {
  runNotificationsMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runNotificationsMigration };
