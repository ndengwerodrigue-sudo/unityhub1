const db = require('../db');

class Notification {
  constructor(row = {}) {
    this.id = row.id || null;
    this.userId = row.user_id;
    this.type = row.type;
    this.title = row.title;
    this.message = row.message;
    this.link = row.link;
    this.isRead = row.is_read ?? false;
    this.createdAt = row.created_at || new Date();
  }

  static async findByUserId(userId, limit = 50) {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(row => new Notification(row));
  }

  static async countUnread(userId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return result.rows[0].count;
  }

  static async markAsRead(id, userId) {
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) return null;
    return new Notification(result.rows[0]);
  }

  static async markAllAsRead(userId) {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );
  }

  static async create({ userId, type, title, message, link }) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, link]
    );
    return new Notification(result.rows[0]);
  }

  static async delete(id, userId) {
    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      link: this.link,
      isRead: this.isRead,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Notification;
