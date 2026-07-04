require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query } = require('../db');

(async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS opportunity_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      applicant_name VARCHAR(255) NOT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      phone VARCHAR(80),
      message TEXT NOT NULL,
      portfolio_url TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'submitted',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (opportunity_id, applicant_id)
    )`);
  console.log('opportunity_applications table ready');
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
