require('dotenv').config();
const { resolveOAuthUser } = require('../utils/oauthHandler');
const { createOAuthCode, exchangeOAuthCode } = require('../utils/authTokens');

async function main() {
  const fakeProfile = {
    id: 'google-test-12345',
    displayName: 'Test Google User',
    emails: [{ value: 'oauth-test@example.com', verified: true }],
    photos: [{ value: 'https://example.com/avatar.jpg' }],
  };

  const user = await resolveOAuthUser('google', fakeProfile);
  console.log('Created user:', user.id, user.email);

  const code = await createOAuthCode(user.id);
  console.log('OAuth code created:', code.slice(0, 8) + '...');

  const userId = await exchangeOAuthCode(code);
  console.log('Code exchanged for user:', userId);

  // cleanup test user
  const db = require('../db');
  await db.query('DELETE FROM user_oauth_providers WHERE user_id = $1', [user.id]);
  await db.query('DELETE FROM auth_oauth_codes WHERE user_id = $1', [user.id]);
  await db.query('DELETE FROM users WHERE id = $1', [user.id]);
  console.log('Test cleanup done — OAuth flow OK');
}

main().catch((e) => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
}).finally(() => process.exit(0));
