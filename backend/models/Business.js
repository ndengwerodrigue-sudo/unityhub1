const db = require('../db');

class Business {
  constructor(row = {}) {
    this.id = row.id || null;
    this.name = row.name;
    this.description = row.description;
    this.category = row.category;
    this.location = row.location;
    this.contact = {
      email: row.email,
      phone: row.phone,
      website: row.website,
      address: row.address,
    };
    this.logo = row.logo || '';
    this.images = row.images || [];
    this.socialMedia = row.social_media || {};
    this.isActive = row.is_active ?? true;
    this.verified = row.verified ?? false;
    this.createdBy = row.created_by || null;
    this.createdAt = row.created_at || new Date();
    this.updatedAt = row.updated_at || new Date();
    
    // Add creator info if joined
    if (row.creator_name) {
      this.creator = {
        name: row.creator_name,
        email: row.creator_email
      };
    }
  }

  static async findActivePaginated({ page = 1, limit = 10, category, location, search, verified }) {
    const offset = (page - 1) * limit;
    const whereParts = ['b.is_active = TRUE'];
    const params = [];

    if (category) {
      params.push(category);
      whereParts.push(`b.category = $${params.length}`);
    }

    if (location) {
      params.push(`%${location}%`);
      whereParts.push(`b.location ILIKE $${params.length}`);
    }

    if (search) {
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
      const base = params.length - 1;
      whereParts.push(`(b.name ILIKE $${base} OR b.description ILIKE $${base + 1})`);
    }

    if (verified !== undefined) {
      params.push(verified);
      whereParts.push(`b.verified = $${params.length}`);
    }

    const whereSql = `WHERE ${whereParts.join(' AND ')}`;

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM businesses b ${whereSql}`,
      params
    );
    const total = countResult.rows[0].count;

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const result = await db.query(
      `SELECT b.*, u.name AS creator_name, u.email AS creator_email
       FROM businesses b
       JOIN users u ON u.id = b.created_by
       ${whereSql}
       ORDER BY b.verified DESC, b.created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      [...params, limit, offset]
    );

    const businesses = result.rows.map(row => new Business(row));
    return { businesses, total };
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT b.*, u.name AS creator_name, u.email AS creator_email
       FROM businesses b
       JOIN users u ON u.id = b.created_by
       WHERE b.id = $1
       LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Business(result.rows[0]);
  }

  static async countByAuthorId(authorId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM businesses WHERE created_by = $1',
      [authorId]
    );
    return result.rows[0].count;
  }

  async save() {
    const now = new Date();

    if (!this.id) {
      const result = await db.query(
        `INSERT INTO businesses (
           name, description, category, location, email, phone, website,
           address, logo, images, social_media, created_by, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          this.name, this.description, this.category, this.location,
          this.contact.email, this.contact.phone, this.contact.website,
          this.contact.address, this.logo, this.images, this.socialMedia,
          this.createdBy, now, now
        ]
      );
      Object.assign(this, new Business(result.rows[0]));
    } else {
      const result = await db.query(
        `UPDATE businesses
         SET name = $1, description = $2, category = $3, location = $4,
             email = $5, phone = $6, website = $7, address = $8,
             logo = $9, images = $10, social_media = $11, is_active = $12,
             verified = $13, updated_at = $14
         WHERE id = $15
         RETURNING *`,
        [
          this.name, this.description, this.category, this.location,
          this.contact.email, this.contact.phone, this.contact.website,
          this.contact.address, this.logo, this.images, this.socialMedia,
          this.isActive, this.verified, now, this.id
        ]
      );
      Object.assign(this, new Business(result.rows[0]));
    }
    return this;
  }
}

module.exports = Business;
