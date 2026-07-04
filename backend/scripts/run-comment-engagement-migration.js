const { query } = require('../db');

async function runCommentEngagementMigration() {
  await query(`
    ALTER TABLE post_comments
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (comment_id, user_id)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id)
  `);
}

module.exports = { runCommentEngagementMigration };
