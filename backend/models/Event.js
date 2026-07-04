const db = require('../db');

class Event {
  constructor(row) {
    this.id = row.id || null;
    this.title = row.title;
    this.description = row.description;
    this.date = row.date;
    this.time = row.time;
    this.location = row.location;
    this.organizer = row.organizer;
    this.category = row.category || 'meetup';
    this.image = row.image || '';
    this.maxAttendees = row.max_attendees ?? row.maxAttendees ?? null;
    this.isActive = row.is_active ?? row.isActive ?? true;
    this.createdBy = row.created_by || row.createdBy || null;
    this.createdAt = row.created_at || row.createdAt || new Date();
    this.updatedAt = row.updated_at || row.updatedAt || new Date();
    this.contactEmail = row.contact_email || row.contactEmail || (row.contactInfo && row.contactInfo.email) || '';
    this.contactPhone = row.contact_phone || row.contactPhone || (row.contactInfo && row.contactInfo.phone) || '';
    this.currentAttendees = row.current_attendees ?? row.currentAttendees ?? 0;
  }

  static async findUpcomingPaginated({ page = 1, limit = 10, category, location, search, userId = null }) {
    const offset = (page - 1) * limit;
    const whereParts = ['is_active = TRUE', 'date >= CURRENT_DATE'];
    const params = [];

    if (category) {
      params.push(category);
      whereParts.push(`category = $${params.length}`);
    }

    if (location) {
      params.push(`%${location}%`);
      whereParts.push(`location ILIKE $${params.length}`);
    }

    if (search) {
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
      const base = params.length - 2;
      whereParts.push(
        `(title ILIKE $${base} OR description ILIKE $${base + 1} OR organizer ILIKE $${base + 2})`
      );
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Count query
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM events
       ${whereSql}`,
      params
    );
    const total = countResult.rows[0].count;

    const listParams = [...params, limit, offset];
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    let attendingSelect = '';
    if (userId) {
      listParams.push(userId);
      attendingSelect = `, EXISTS(SELECT 1 FROM event_attendees ea2 WHERE ea2.event_id = e.id AND ea2.user_id = $${listParams.length}) AS is_attending`;
    }

    const eventsResult = await db.query(
      `SELECT e.*,
              COALESCE((
                SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id
              ), 0) AS current_attendees
              ${attendingSelect}
       FROM events e
       ${whereSql}
       ORDER BY e.date ASC, e.time ASC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      listParams
    );

    const events = eventsResult.rows.map((row) => {
      const ev = new Event(row);
      if (userId) ev.isAttending = !!row.is_attending;
      return ev;
    });
    return { events, total };
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT e.*,
              COALESCE((
                SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id
              ), 0) AS current_attendees
       FROM events e
       WHERE e.id = $1
       LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return new Event(result.rows[0]);
  }

  static async countByAuthorId(authorId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM events WHERE created_by = $1',
      [authorId]
    );
    return result.rows[0].count;
  }

  static async findUpcoming(limit = 5) {
    const result = await db.query(
      `SELECT e.*,
              COALESCE((
                SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id
              ), 0) AS current_attendees
       FROM events e
       WHERE e.is_active = TRUE AND e.date >= CURRENT_DATE
       ORDER BY e.date ASC, e.time ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(row => new Event(row));
  }

  async save() {
    const now = new Date();

    if (!this.id) {
      const result = await db.query(
        `INSERT INTO events (
           title, description, date, time, location, organizer,
           contact_email, contact_phone, category, image,
           max_attendees, is_active, created_by, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          this.title,
          this.description,
          this.date,
          this.time,
          this.location,
          this.organizer,
          this.contactEmail,
          this.contactPhone,
          this.category || 'meetup',
          this.image || '',
          this.maxAttendees,
          this.isActive !== undefined ? this.isActive : true,
          this.createdBy,
          now,
          now,
        ]
      );

      const row = result.rows[0];
      this.id = row.id;
      this.title = row.title;
      this.description = row.description;
      this.date = row.date;
      this.time = row.time;
      this.location = row.location;
      this.organizer = row.organizer;
      this.category = row.category;
      this.image = row.image;
      this.maxAttendees = row.max_attendees;
      this.isActive = row.is_active;
      this.createdBy = row.created_by;
      this.createdAt = row.created_at;
      this.updatedAt = row.updated_at;
      this.contactEmail = row.contact_email;
      this.contactPhone = row.contact_phone;
      this.currentAttendees = 0;
    } else {
      const result = await db.query(
        `UPDATE events
         SET title = $1,
             description = $2,
             date = $3,
             time = $4,
             location = $5,
             organizer = $6,
             contact_email = $7,
             contact_phone = $8,
             category = $9,
             image = $10,
             max_attendees = $11,
             is_active = $12,
             updated_at = $13
         WHERE id = $14
         RETURNING *`,
        [
          this.title,
          this.description,
          this.date,
          this.time,
          this.location,
          this.organizer,
          this.contactEmail,
          this.contactPhone,
          this.category,
          this.image,
          this.maxAttendees,
          this.isActive,
          now,
          this.id,
        ]
      );

      const row = result.rows[0];
      this.title = row.title;
      this.description = row.description;
      this.date = row.date;
      this.time = row.time;
      this.location = row.location;
      this.organizer = row.organizer;
      this.category = row.category;
      this.image = row.image;
      this.maxAttendees = row.max_attendees;
      this.isActive = row.is_active;
      this.createdBy = row.created_by;
      this.createdAt = row.created_at;
      this.updatedAt = row.updated_at;
      this.contactEmail = row.contact_email;
      this.contactPhone = row.contact_phone;
    }

    return this;
  }

  static async findAllPaginated({ page = 1, limit = 20, includeInactive = false } = {}) {
    const offset = (page - 1) * limit;
    const where = includeInactive ? '' : 'WHERE is_active = TRUE';
    const [count, rows] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM events ${where}`),
      db.query(
        `SELECT e.*,
                COALESCE((SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id), 0) AS current_attendees
         FROM events e ${where}
         ORDER BY e.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);
    return { events: rows.rows.map((r) => new Event(r)), total: count.rows[0].count };
  }

  static async findByOwner(ownerId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [count, rows] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM events WHERE created_by = $1', [ownerId]),
      db.query(
        `SELECT e.*,
                COALESCE((SELECT COUNT(*)::int FROM event_attendees ea WHERE ea.event_id = e.id), 0) AS current_attendees
         FROM events e WHERE e.created_by = $1
         ORDER BY e.created_at DESC LIMIT $2 OFFSET $3`,
        [ownerId, limit, offset]
      ),
    ]);
    return { events: rows.rows.map((r) => new Event(r)), total: count.rows[0].count };
  }

  static async findAttendees(eventId) {
    const result = await db.query(
      `SELECT ea.event_id, ea.user_id, ea.status, ea.created_at,
              u.name, u.email, u.avatar, u.location, u.role
       FROM event_attendees ea
       JOIN users u ON u.id = ea.user_id
       WHERE ea.event_id = $1
       ORDER BY ea.created_at DESC`,
      [eventId]
    );
    return result.rows.map((r) => ({
      userId: r.user_id,
      eventId: r.event_id,
      status: r.status || 'registered',
      registeredAt: r.created_at,
      name: r.name,
      email: r.email,
      avatar: r.avatar || '',
      location: r.location || '',
      role: r.role || '',
    }));
  }

  static async findRegistrationsByOwner(ownerId) {
    const result = await db.query(
      `SELECT ea.*, e.title AS event_title, e.date AS event_date,
              u.name, u.email, u.avatar, u.location, u.role
       FROM event_attendees ea
       JOIN events e ON e.id = ea.event_id
       JOIN users u ON u.id = ea.user_id
       WHERE e.created_by = $1
       ORDER BY ea.created_at DESC`,
      [ownerId]
    );
    return result.rows.map((r) => ({
      userId: r.user_id,
      eventId: r.event_id,
      eventTitle: r.event_title,
      eventDate: r.event_date,
      status: r.status || 'registered',
      registeredAt: r.created_at,
      name: r.name,
      email: r.email,
      avatar: r.avatar || '',
      location: r.location || '',
      role: r.role || '',
    }));
  }

  static async deleteById(id) {
    await db.query('DELETE FROM events WHERE id = $1', [id]);
  }

  static async toggleAttendance({ eventId, userId }) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('EventNotFound');
    }
    if (String(event.createdBy) === String(userId)) {
      throw new Error('SelfRegister');
    }
    if (!event.isActive) {
      throw new Error('EventInactive');
    }
    if (event.date <= new Date()) {
      throw new Error('EventInPast');
    }

    const existing = await db.query(
      'SELECT 1 FROM event_attendees WHERE event_id = $1 AND user_id = $2 LIMIT 1',
      [eventId, userId]
    );

    let attending;
    if (existing.rows.length) {
      await db.query(
        'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      attending = false;
    } else {
      if (event.maxAttendees) {
        const countResult = await db.query(
          'SELECT COUNT(*)::int AS count FROM event_attendees WHERE event_id = $1',
          [eventId]
        );
        const current = countResult.rows[0].count;
        if (current >= event.maxAttendees) {
          throw new Error('EventFull');
        }
      }

      await db.query(
        'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [eventId, userId]
      );
      attending = true;
    }

    const finalCountResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM event_attendees WHERE event_id = $1',
      [eventId]
    );

    return {
      attending,
      currentAttendees: finalCountResult.rows[0].count,
      maxAttendees: event.maxAttendees,
    };
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      date: this.date,
      time: this.time,
      location: this.location,
      organizer: this.organizer,
      category: this.category,
      image: this.image,
      maxAttendees: this.maxAttendees,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      contactInfo: {
        email: this.contactEmail,
        phone: this.contactPhone,
      },
      currentAttendees: this.currentAttendees,
      isAttending: this.isAttending ?? false,
    };
  }
}

module.exports = Event;
