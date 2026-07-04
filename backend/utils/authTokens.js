const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(userId, rememberMe = false) {
  const expiresIn = rememberMe
    ? process.env.JWT_REMEMBER_EXPIRE || '30d'
    : process.env.JWT_EXPIRE || '1d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
}

async function createSession(userId, { rememberMe = false, userAgent, ip } = {}) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshHash = hashToken(refreshToken);
  const days = rememberMe ? 30 : 14;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, refreshHash, expiresAt, userAgent || null, ip || null]
  );

  return refreshToken;
}

async function issueAuthResponse(userId, options = {}) {
  const accessToken = generateAccessToken(userId, options.rememberMe);
  const refreshToken = await createSession(userId, options);
  return { accessToken, refreshToken };
}

async function refreshAccessToken(refreshToken, meta = {}) {
  const hash = hashToken(refreshToken);
  const result = await db.query(
    `SELECT s.*, u.is_active FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
     LIMIT 1`,
    [hash]
  );

  if (!result.rows.length || !result.rows[0].is_active) {
    return null;
  }

  const session = result.rows[0];

  await db.query(`UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1`, [session.id]);

  const newRefresh = crypto.randomBytes(48).toString('hex');
  const newHash = hashToken(newRefresh);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [session.user_id, newHash, expiresAt, meta.userAgent || session.user_agent, meta.ip || session.ip_address]
  );

  return {
    userId: session.user_id,
    accessToken: generateAccessToken(session.user_id, false),
    refreshToken: newRefresh,
  };
}

async function revokeSession(refreshToken) {
  if (!refreshToken) return;
  const hash = hashToken(refreshToken);
  await db.query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1 AND revoked_at IS NULL`,
    [hash]
  );
}

async function revokeAllSessions(userId) {
  await db.query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

async function createOAuthCode(userId) {
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.query(
    `INSERT INTO auth_oauth_codes (code, user_id, expires_at) VALUES ($1, $2, $3)`,
    [code, userId, expiresAt]
  );
  return code;
}

async function exchangeOAuthCode(code) {
  const result = await db.query(
    `UPDATE auth_oauth_codes
     SET used_at = NOW()
     WHERE code = $1 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [code]
  );
  return result.rows[0]?.user_id || null;
}

module.exports = {
  generateAccessToken,
  issueAuthResponse,
  refreshAccessToken,
  revokeSession,
  revokeAllSessions,
  createOAuthCode,
  exchangeOAuthCode,
};
