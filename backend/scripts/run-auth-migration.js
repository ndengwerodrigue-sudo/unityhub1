const { query } = require('../db');

async function safeQuery(label, sql, params) {
  try {
    await query(sql, params);
  } catch (err) {
    console.warn(`Auth migration (${label}):`, err.message);
  }
}

async function runAuthMigration() {
  // OAuth tables — create first; unity_user may not own `users` but can usually CREATE new tables
  await query(`
    CREATE TABLE IF NOT EXISTS user_oauth_providers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider VARCHAR(20) NOT NULL,
      provider_id VARCHAR(255) NOT NULL,
      provider_username VARCHAR(255),
      profile_url TEXT,
      connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(provider, provider_id),
      UNIQUE(user_id, provider)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      user_agent TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS auth_oauth_codes (
      code VARCHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    )
  `);

  await safeQuery('idx_auth_sessions_user', `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)`);
  await safeQuery('idx_user_oauth_providers_user', `CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_user ON user_oauth_providers(user_id)`);

  // Extend users table — may fail if DB user is not table owner
  await safeQuery('users.provider', `ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'local'`);
  await safeQuery('users.provider_id', `ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)`);
  await safeQuery('users.email_verified', `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`);
  await safeQuery('users.last_login', `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`);
  await safeQuery('users.password_nullable', `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);
}

module.exports = { runAuthMigration };
