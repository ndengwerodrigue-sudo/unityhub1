require('dotenv').config();
const db = require('../db');

async function main() {
  const cols = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`
  );
  console.log('users columns:', cols.rows.map((x) => x.column_name).join(', '));

  const oauth = await db.query(`SELECT to_regclass('public.user_oauth_providers') AS t`);
  console.log('user_oauth_providers:', oauth.rows[0].t);

  const sessions = await db.query(`SELECT to_regclass('public.auth_oauth_codes') AS t`);
  console.log('auth_oauth_codes:', sessions.rows[0].t);
}

main().catch(console.error).finally(() => process.exit(0));
