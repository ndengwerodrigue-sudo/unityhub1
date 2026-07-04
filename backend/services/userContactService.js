const db = require('../db');

let usersColumnsCache = null;

async function detectUsersContactColumns() {
  if (usersColumnsCache !== null) return usersColumnsCache;
  const res = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'
       AND column_name IN ('phone', 'whatsapp_opt_in')`
  );
  const cols = new Set(res.rows.map((r) => r.column_name));
  usersColumnsCache = { phone: cols.has('phone'), whatsappOptIn: cols.has('whatsapp_opt_in') };
  return usersColumnsCache;
}

async function ensureContactTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS user_contact_preferences (
       user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
       phone VARCHAR(50),
       whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );
}

function normalizePhone(phone) {
  if (phone == null || phone === '') return null;
  const trimmed = String(phone).trim();
  return trimmed || null;
}

function normalizeOptIn(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

async function getContact(userId) {
  await ensureContactTable();
  const cols = await detectUsersContactColumns();
  let phone = null;
  let whatsappOptIn = false;

  if (cols.phone || cols.whatsappOptIn) {
    try {
      const fields = ['id'];
      if (cols.phone) fields.push('phone');
      if (cols.whatsappOptIn) fields.push('whatsapp_opt_in');
      const userRes = await db.query(
        `SELECT ${fields.join(', ')} FROM users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      if (userRes.rows[0]) {
        if (cols.phone) phone = userRes.rows[0].phone || null;
        if (cols.whatsappOptIn) whatsappOptIn = !!userRes.rows[0].whatsapp_opt_in;
      }
    } catch {
      // users columns unavailable at runtime
    }
  }

  try {
    const prefRes = await db.query(
      `SELECT phone, whatsapp_opt_in FROM user_contact_preferences WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (prefRes.rows[0]) {
      if (!phone && prefRes.rows[0].phone) phone = prefRes.rows[0].phone;
      if (!whatsappOptIn && prefRes.rows[0].whatsapp_opt_in) whatsappOptIn = true;
    }
  } catch {
    // preferences table not ready
  }

  return { phone, whatsappOptIn };
}

async function getContactsMap(userIds) {
  const map = {};
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  ids.forEach((id) => {
    map[id] = { phone: null, whatsappOptIn: false };
  });
  if (!ids.length) return map;

  await ensureContactTable();
  const cols = await detectUsersContactColumns();

  if (cols.phone || cols.whatsappOptIn) {
    try {
      const fields = ['id'];
      if (cols.phone) fields.push('phone');
      if (cols.whatsappOptIn) fields.push('whatsapp_opt_in');
      const userRes = await db.query(
        `SELECT ${fields.join(', ')} FROM users WHERE id = ANY($1::uuid[])`,
        [ids]
      );
      userRes.rows.forEach((row) => {
        const key = String(row.id);
        if (!map[key]) map[key] = { phone: null, whatsappOptIn: false };
        if (cols.phone && row.phone) map[key].phone = row.phone;
        if (cols.whatsappOptIn && row.whatsapp_opt_in) map[key].whatsappOptIn = true;
      });
    } catch {
      // ignore
    }
  }

  try {
    const prefRes = await db.query(
      `SELECT user_id, phone, whatsapp_opt_in FROM user_contact_preferences WHERE user_id = ANY($1::uuid[])`,
      [ids]
    );
    prefRes.rows.forEach((row) => {
      const key = String(row.user_id);
      if (!map[key]) map[key] = { phone: null, whatsappOptIn: false };
      if (!map[key].phone && row.phone) map[key].phone = row.phone;
      if (!map[key].whatsappOptIn && row.whatsapp_opt_in) map[key].whatsappOptIn = true;
    });
  } catch {
    // ignore
  }

  return map;
}

async function setContact(userId, { phone, whatsappOptIn }) {
  await ensureContactTable();
  const cols = await detectUsersContactColumns();
  const normalizedPhone = normalizePhone(phone);
  const normalizedOptIn = normalizedPhone ? normalizeOptIn(whatsappOptIn) : false;

  if (cols.phone && cols.whatsappOptIn) {
    try {
      await db.query(
        `UPDATE users SET phone = $1, whatsapp_opt_in = $2, updated_at = NOW() WHERE id = $3`,
        [normalizedPhone, normalizedOptIn, userId]
      );
    } catch {
      // fall through to preferences table
    }
  } else if (cols.phone) {
    try {
      await db.query(
        `UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2`,
        [normalizedPhone, userId]
      );
    } catch {
      // fall through
    }
  }

  await db.query(
    `INSERT INTO user_contact_preferences (user_id, phone, whatsapp_opt_in, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       phone = EXCLUDED.phone,
       whatsapp_opt_in = EXCLUDED.whatsapp_opt_in,
       updated_at = NOW()`,
    [userId, normalizedPhone, normalizedOptIn]
  );

  return { phone: normalizedPhone, whatsappOptIn: normalizedOptIn };
}

module.exports = {
  ensureContactTable,
  getContact,
  getContactsMap,
  setContact,
  normalizePhone,
};
