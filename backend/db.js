const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. PostgreSQL connection will fail until it is configured.');
}

const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
};

