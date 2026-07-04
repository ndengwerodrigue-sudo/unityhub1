const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. PostgreSQL connection will fail until it is configured.');
}

const poolConfig = { connectionString };

// Cloud Postgres (Railway, Neon, Render) requires SSL
if (
  connectionString &&
  process.env.NODE_ENV === 'production' &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1')
) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
};

