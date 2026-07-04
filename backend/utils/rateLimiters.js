const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

/** Routes that must never be rate-limited (OAuth redirects, preflight, health). */
function shouldSkipRateLimit(req) {
  if (req.method === 'OPTIONS') return true;

  const url = req.originalUrl || req.url || '';

  if (url.startsWith('/api/health')) return true;

  // Google / GitHub OAuth entry + callback (browser redirects)
  if (/^\/api\/auth\/(google|github)(\/callback)?(\?|$)/.test(url)) return true;

  return false;
}

function createGlobalLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 3000 : 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: { message: 'Too many requests. Please wait a moment and try again.' },
  });
}

function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 150 : 40,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: { message: 'Too many authentication attempts. Please try again in a few minutes.' },
  });
}

function createLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 80 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  });
}

function createRefreshLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 300 : 80,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: { message: 'Too many session refresh attempts. Please log in again.' },
  });
}

function createOAuthExchangeLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 60 : 25,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: { message: 'Too many sign-in attempts. Please wait a few minutes.' },
  });
}

module.exports = {
  createGlobalLimiter,
  createAuthLimiter,
  createLoginLimiter,
  createRefreshLimiter,
  createOAuthExchangeLimiter,
  shouldSkipRateLimit,
};
