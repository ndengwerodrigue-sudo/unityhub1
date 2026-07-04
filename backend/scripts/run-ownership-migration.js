const db = require('../db');

async function runOwnershipMigration() {
  await db.query(`
    UPDATE opportunity_applications SET status = 'pending' WHERE status = 'submitted'
  `);

  await db.query(`
    ALTER TABLE opportunity_applications
      ALTER COLUMN status SET DEFAULT 'pending'
  `).catch(() => {});

  await db.query(`
    ALTER TABLE opportunity_applications
      ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL
  `);

  await db.query(`
    ALTER TABLE opportunity_applications
      ADD COLUMN IF NOT EXISTS owner_notes TEXT
  `);

  await db.query(`
    ALTER TABLE opportunity_applications
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `).catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      time VARCHAR(10) NOT NULL,
      location VARCHAR(100) NOT NULL,
      organizer VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      category VARCHAR(50) NOT NULL DEFAULT 'meetup',
      image TEXT,
      max_attendees INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS event_attendees (
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(30) NOT NULL DEFAULT 'registered',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (event_id, user_id)
    )
  `);

  await db.query(`
    ALTER TABLE event_attendees
      ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'registered'
  `).catch(() => {});

  console.log('Ownership migration complete');
}

module.exports = { runOwnershipMigration };

if (require.main === module) {
  runOwnershipMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
