const db = require('../db');

class EmailLog {
  static async create({ messageId, conversationId, recipientEmail, senderName, subject, bodyHtml }) {
    const result = await db.query(
      `INSERT INTO email_logs (message_id, conversation_id, recipient_email, sender_name, subject, body_html)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [messageId || null, conversationId || null, recipientEmail, senderName, subject, bodyHtml]
    );
    return result.rows[0];
  }

  static async markSent(id) {
    const result = await db.query(
      `UPDATE email_logs SET status = 'sent', sent_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async markFailed(id, errorMessage) {
    const result = await db.query(
      `UPDATE email_logs SET status = 'failed', error_message = $1 WHERE id = $2 RETURNING *`,
      [errorMessage, id]
    );
    return result.rows[0];
  }

  static async findByConversation(conversationId) {
    const result = await db.query(
      'SELECT * FROM email_logs WHERE conversation_id = $1 ORDER BY created_at DESC',
      [conversationId]
    );
    return result.rows;
  }

  static async findAll({ page = 1, limit = 50, status } = {}) {
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = 'WHERE status = $1';
    }
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const result = await db.query(
      `SELECT el.*, c.opportunity_id, o.title AS opportunity_title
       FROM email_logs el
       LEFT JOIN conversations c ON c.id = el.conversation_id
       LEFT JOIN opportunities o ON o.id = c.opportunity_id
       ${where}
       ORDER BY el.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return result.rows;
  }

  static toJSON(row) {
    return {
      id: row.id,
      messageId: row.message_id,
      conversationId: row.conversation_id,
      recipientEmail: row.recipient_email,
      senderName: row.sender_name,
      subject: row.subject,
      bodyHtml: row.body_html,
      status: row.status,
      errorMessage: row.error_message,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      opportunityId: row.opportunity_id,
      opportunityTitle: row.opportunity_title,
    };
  }
}

module.exports = EmailLog;
