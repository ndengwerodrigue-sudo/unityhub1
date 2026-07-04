const { query } = require('../db');

const EXTENDED_COLUMNS = [
  `work_mode VARCHAR(20) DEFAULT 'onsite'`,
  `employment_type VARCHAR(30)`,
  `experience_level VARCHAR(30)`,
  `salary_min INTEGER`,
  `salary_max INTEGER`,
  `salary_currency VARCHAR(10) DEFAULT 'XAF'`,
  `stipend TEXT`,
  `skills TEXT[] DEFAULT '{}'`,
  `tags TEXT[] DEFAULT '{}'`,
  `responsibilities TEXT`,
  `requirements TEXT`,
  `benefits TEXT`,
  `company_description TEXT`,
  `industry VARCHAR(100)`,
  `company_logo TEXT`,
  `is_verified BOOLEAN DEFAULT FALSE`,
  `is_featured BOOLEAN DEFAULT FALSE`,
  `view_count INTEGER DEFAULT 0`,
  `application_count INTEGER DEFAULT 0`,
  `application_questions JSONB DEFAULT '[]'`,
  `required_documents JSONB DEFAULT '[]'`,
  `max_applicants INTEGER`,
  `application_process TEXT`,
  `faq JSONB DEFAULT '[]'`,
  `status VARCHAR(30) DEFAULT 'published'`,
];

async function runOpportunitiesV2Migration() {
  for (const col of EXTENDED_COLUMNS) {
    const name = col.split(' ')[0];
    await query(`ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ${col}`);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS opportunity_saved (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      folder VARCHAR(100) NOT NULL DEFAULT 'default',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, opportunity_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS opportunity_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_opportunity_views_opp ON opportunity_views(opportunity_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_opportunity_saved_user ON opportunity_saved(user_id)
  `);

  const appCols = [
    `resume_url TEXT`,
    `cover_letter_url TEXT`,
    `answers JSONB DEFAULT '{}'`,
    `application_number VARCHAR(24)`,
    `updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `linkedin_url TEXT`,
    `github_url TEXT`,
    `website_url TEXT`,
  ];

  for (const col of appCols) {
    await query(`ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS ${col}`);
  }
}

module.exports = { runOpportunitiesV2Migration };
