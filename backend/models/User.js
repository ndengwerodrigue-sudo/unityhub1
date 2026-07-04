const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');

const USER_COLUMNS = `
  id, name, email, password_hash, role, location, avatar, bio, is_active, created_at, updated_at
`;

class User {
  constructor(row) {
    this.id = row.id;
    this._id = this.id;
    this.name = row.name;
    this.email = row.email;
    this.password = row.password_hash ?? row.password;
    this.role = row.role;
    this.location = row.location;
    this.avatar = row.avatar || '';
    this.bio = row.bio || '';
    this.isActive = row.is_active ?? row.isActive ?? true;
    this.provider = row.provider || 'local';
    this.providerId = row.provider_id || null;
    this.emailVerified = row.email_verified ?? false;
    this.lastLogin = row.last_login || null;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
    this.oauthProviders = row.oauth_providers || [];
    this.phone = row.phone || null;
    this.whatsappOptIn = row.whatsapp_opt_in ?? row.whatsappOptIn ?? false;
  }

  static mapRow(row, oauthProviders = []) {
    return new User({ ...row, oauth_providers: oauthProviders });
  }

  static async findOne({ email }) {
    const result = await db.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (!result.rows.length) return null;
    const providers = await User.getOAuthProviders(result.rows[0].id);
    return User.mapRow(result.rows[0], providers);
  }

  static async findByEmailWithPassword(email) {
    const result = await db.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (!result.rows.length) return null;
    return User.mapRow(result.rows[0]);
  }

  static async attachContact(user) {
    if (!user) return user;
    try {
      const { getContact } = require('../services/userContactService');
      const contact = await getContact(user.id);
      user.phone = contact.phone;
      user.whatsappOptIn = contact.whatsappOptIn;
    } catch {
      user.phone = user.phone || null;
      user.whatsappOptIn = user.whatsappOptIn || false;
    }
    return user;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!result.rows.length) return null;
    const providers = await User.getOAuthProviders(id);
    const user = User.mapRow(result.rows[0], providers);
    return User.attachContact(user);
  }

  static async findByOAuthProvider(provider, providerId) {
    const link = await db.query(
      `SELECT user_id FROM user_oauth_providers WHERE provider = $1 AND provider_id = $2 LIMIT 1`,
      [provider, String(providerId)]
    );
    if (link.rows.length) {
      return User.findById(link.rows[0].user_id);
    }
    return null;
  }

  static async getOAuthProviders(userId) {
    const result = await db.query(
      `SELECT provider, provider_id, provider_username, profile_url, connected_at
       FROM user_oauth_providers WHERE user_id = $1 ORDER BY connected_at ASC`,
      [userId]
    );
    return result.rows.map((r) => ({
      provider: r.provider,
      providerId: r.provider_id,
      username: r.provider_username,
      profileUrl: r.profile_url,
      connectedAt: r.connected_at,
    }));
  }

  static async linkOAuthProvider(userId, meta) {
    await db.query(
      `INSERT INTO user_oauth_providers (user_id, provider, provider_id, provider_username, profile_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         provider_id = EXCLUDED.provider_id,
         provider_username = EXCLUDED.provider_username,
         profile_url = EXCLUDED.profile_url,
         connected_at = NOW()`,
      [userId, meta.provider, meta.providerId, meta.providerUsername || null, meta.profileUrl || null]
    );

    const user = await User.findById(userId);
    if (user && meta.avatar && !user.avatar) {
      await db.query(`UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2`, [meta.avatar, userId]);
    }
    if (meta.emailVerified) {
      await User.setEmailVerified(userId, true);
    }
  }

  static async unlinkOAuthProvider(userId, provider) {
    await db.query(
      `DELETE FROM user_oauth_providers WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );
  }

  static async setEmailVerified(userId, verified = true) {
    try {
      await db.query(`UPDATE users SET email_verified = $1, updated_at = NOW() WHERE id = $2`, [verified, userId]);
    } catch {
      // column may not exist on legacy schema
    }
  }

  static async updateLastLogin(userId) {
    try {
      await db.query(`UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`, [userId]);
    } catch {
      await db.query(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [userId]);
    }
  }

  static async createFromOAuth(meta) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);
    const now = new Date();

    const result = await db.query(
      `INSERT INTO users (
         name, email, password_hash, role, location, avatar, bio, is_active, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $8)
       RETURNING ${USER_COLUMNS}`,
      [
        meta.name,
        meta.email || `${meta.provider}_${meta.providerId}@oauth.local`,
        hashedPassword,
        'student',
        'Cameroon',
        meta.avatar || '',
        '',
        now,
      ]
    );

    const user = User.mapRow(result.rows[0]);
    await User.linkOAuthProvider(user.id, meta);
    return User.findById(user.id);
  }

  static async findActivePaginated({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const usersResult = await db.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE is_active = TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await db.query(`SELECT COUNT(*)::int AS count FROM users WHERE is_active = TRUE`);
    return {
      users: usersResult.rows.map((row) => User.mapRow(row)),
      total: countResult.rows[0].count,
    };
  }

  static async hasPassword(userId) {
    const result = await db.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    return !!result.rows[0]?.password_hash;
  }

  async save() {
    const now = new Date();

    if (!this.id) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(this.password, salt);

      const result = await db.query(
        `INSERT INTO users (
           name, email, password_hash, role, location, avatar, bio, is_active, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING ${USER_COLUMNS}`,
        [
          this.name,
          this.email,
          hashedPassword,
          this.role || 'student',
          this.location,
          this.avatar || '',
          this.bio || '',
          this.isActive !== undefined ? this.isActive : true,
          now,
        ]
      );
      Object.assign(this, User.mapRow(result.rows[0]));
    } else {
      const result = await db.query(
        `UPDATE users SET name=$1, email=$2, role=$3, location=$4, avatar=$5, bio=$6,
         is_active=$7, updated_at=$8 WHERE id=$9 RETURNING ${USER_COLUMNS}`,
        [this.name, this.email, this.role, this.location, this.avatar, this.bio, this.isActive, now, this.id]
      );
      Object.assign(this, User.mapRow(result.rows[0], await User.getOAuthProviders(this.id)));
    }
    return this;
  }

  async comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  toProfileJSON() {
    const primaryProvider = this.oauthProviders[0]?.provider || this.provider || 'local';
    return {
      id: this.id,
      _id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      location: this.location,
      avatar: this.avatar,
      bio: this.bio,
      isActive: this.isActive,
      provider: primaryProvider,
      providerId: this.oauthProviders[0]?.providerId || this.providerId,
      emailVerified: this.emailVerified || this.oauthProviders.length > 0,
      lastLogin: this.lastLogin,
      oauthProviders: this.oauthProviders,
      connectedProviders: this.oauthProviders.map((p) => p.provider),
      phone: this.phone || null,
      whatsappOptIn: !!this.whatsappOptIn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
