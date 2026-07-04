const db = require('../db');
const Attachment = require('./Attachment');

class Message {
  constructor(row = {}) {
    this.id = row.id;
    this.conversationId = row.conversation_id;
    this.senderId = row.sender_id;
    this.receiverId = row.receiver_id;
    this.messageBody = row.message_body;
    this.messageType = row.message_type;
    this.deliveryStatus = row.delivery_status;
    this.readAt = row.read_at;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create({ conversationId, senderId, receiverId, messageBody, messageType = 'internal', deliveryStatus = 'sent' }) {
    const result = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_body, message_type, delivery_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [conversationId, senderId, receiverId, messageBody, messageType, deliveryStatus]
    );
    await db.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);
    return result.rows[0];
  }

  static async findByConversation(conversationId, userId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );
    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM messages WHERE conversation_id = $1',
      [conversationId]
    );

    const messages = result.rows.reverse();
    const messageIds = messages.map((m) => m.id);
    let attachmentsByMessage = {};
    if (messageIds.length > 0) {
      try {
        const attResult = await db.query(
          `SELECT * FROM message_attachments WHERE message_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
          [messageIds]
        );
        attResult.rows.forEach((att) => {
          if (!attachmentsByMessage[att.message_id]) attachmentsByMessage[att.message_id] = [];
          attachmentsByMessage[att.message_id].push(Attachment.toJSON(att));
        });
      } catch (err) {
        console.warn('Message attachments load skipped:', err.message);
      }
    }

    return {
      messages: messages.map((m) => ({
        ...m,
        attachments: attachmentsByMessage[m.id] || [],
      })),
      total: countResult.rows[0].count,
      page,
      limit,
    };
  }

  static async markAsRead(messageId, userId) {
    const result = await db.query(
      `UPDATE messages SET read_at = NOW() WHERE id = $1 AND receiver_id = $2 AND read_at IS NULL RETURNING *`,
      [messageId, userId]
    );
    return result.rows[0] || null;
  }

  static async markConversationAsRead(conversationId, userId) {
    try {
      await db.query(
        `UPDATE messages SET read_at = NOW()
         WHERE conversation_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
        [conversationId, userId]
      );
      await db.query(
        `UPDATE conversation_participants SET last_read_at = NOW()
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );
    } catch (err) {
      console.warn('markConversationAsRead:', err.message);
    }
  }

  static async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM messages m
       JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1 AND cp.deleted_at IS NULL
       WHERE m.receiver_id = $1 AND m.read_at IS NULL`,
      [userId]
    );
    return result.rows[0].count;
  }

  static async getUnreadByConversation(userId) {
    const result = await db.query(
      `SELECT m.conversation_id, COUNT(*)::int AS count
       FROM messages m
       JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1 AND cp.deleted_at IS NULL
       WHERE m.receiver_id = $1 AND m.read_at IS NULL
       GROUP BY m.conversation_id`,
      [userId]
    );
    return result.rows;
  }

  static async updateDeliveryStatus(messageId, status) {
    const result = await db.query(
      `UPDATE messages SET delivery_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, messageId]
    );
    return result.rows[0] || null;
  }

  static async retryFailed(conversationId) {
    const result = await db.query(
      `UPDATE messages SET delivery_status = 'queued', updated_at = NOW()
       WHERE conversation_id = $1 AND delivery_status = 'failed'
       RETURNING *`,
      [conversationId]
    );
    return result.rows;
  }

  static async searchMessages(userId, query, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [`%${query}%`, userId];
    const result = await db.query(
      `SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar, c.opportunity_id,
              o.title AS opportunity_title
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       JOIN opportunities o ON o.id = c.opportunity_id
       JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2 AND cp.deleted_at IS NULL
       JOIN users u ON u.id = m.sender_id
       WHERE m.message_body ILIKE $1
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [...params, limit, offset]
    );
    return result.rows;
  }

  static toJSON(row) {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      messageBody: row.message_body,
      messageType: row.message_type,
      deliveryStatus: row.delivery_status,
      readAt: row.read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
      opportunityId: row.opportunity_id,
      opportunityTitle: row.opportunity_title,
      attachments: row.attachments || [],
    };
  }
}

module.exports = Message;
