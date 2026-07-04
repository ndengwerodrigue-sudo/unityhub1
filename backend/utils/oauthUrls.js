/**
 * Returns the API server base URL for OAuth callbacks (no trailing slash).
 * OAUTH_CALLBACK_URL should be the server root, e.g. http://localhost:5001
 */
function getOAuthServerBase() {
  let base = (
    process.env.OAUTH_CALLBACK_URL ||
    process.env.APP_URL ||
    `http://localhost:${process.env.PORT || 5001}`
  ).replace(/\/+$/, '');

  // Fix common misconfiguration: full callback path instead of server base
  if (base.includes('/api/auth/')) {
    base = base.split('/api/auth/')[0].replace(/\/+$/, '');
  }

  return base;
}

function getGoogleCallbackUrl() {
  return `${getOAuthServerBase()}/api/auth/google/callback`;
}

function getGithubCallbackUrl() {
  return `${getOAuthServerBase()}/api/auth/github/callback`;
}

module.exports = {
  getOAuthServerBase,
  getGoogleCallbackUrl,
  getGithubCallbackUrl,
};
