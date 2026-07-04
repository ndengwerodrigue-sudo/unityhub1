const { query } = require('../db');
require('dotenv').config();

async function runPostMediaMigration() {
  // Separate table — works when the DB user cannot ALTER the posts table
  await query(`
    CREATE TABLE IF NOT EXISTS post_media (
      post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
      videos TEXT[] NOT NULL DEFAULT '{}',
      audio_track JSONB DEFAULT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Optional: also add columns on posts when the user has permission
  try {
    await query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS videos TEXT[] NOT NULL DEFAULT '{}'`);
    await query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_track JSONB DEFAULT NULL`);
  } catch (err) {
    console.warn('posts media columns (optional):', err.message);
  }

  console.log('Post media storage ready (post_media table)');
}

if (require.main === module) {
  runPostMediaMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runPostMediaMigration };
