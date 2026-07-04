require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query } = require('../db');

(async () => {
  const r = await query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('post_favorites', 'post_reposts')`
  );
  console.log('Tables:', r.rows.map((x) => x.table_name));
  const cols = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'posts' AND column_name = 'repost_of_id'`
  );
  console.log('repost_of_id column:', cols.rows.length ? 'yes' : 'no');
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
