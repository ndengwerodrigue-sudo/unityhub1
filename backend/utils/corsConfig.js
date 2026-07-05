/**
 * CORS allowed origins for frontend (Vercel) ↔ API (Railway).
 */
function parseOriginList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function getAllowedOrigins() {
  const fromEnv = [
    ...parseOriginList(process.env.FRONTEND_URLS),
    ...parseOriginList(process.env.FRONTEND_URL),
  ];

  if (!fromEnv.length) {
    fromEnv.push('http://localhost:3000', 'http://localhost:3001');
  }

  fromEnv.push('http://127.0.0.1:3000', 'http://127.0.0.1:3001');

  return [...new Set(fromEnv)];
}

function isOriginAllowed(origin) {
  if (!origin) return true;

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return true;

  // Vercel preview URLs: https://unityhub1-xxx.vercel.app
  if (process.env.NODE_ENV === 'production') {
    const primary = process.env.FRONTEND_URL || allowed.find((o) => o.includes('vercel.app')) || '';
    if (primary.includes('vercel.app') && /^https:\/\/[\w.-]+\.vercel\.app$/i.test(origin)) {
      return true;
    }
  }

  return false;
}

function createCorsOptions() {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}. Set FRONTEND_URLS on Railway.`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

module.exports = { getAllowedOrigins, isOriginAllowed, createCorsOptions };
