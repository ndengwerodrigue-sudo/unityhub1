const db = require('../db');

class Conversation {
  constructor(row = {}) {
    this.id = row.id;
    this.opportunityId = row.opportunity_id;
    this.subject = row.subject;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  /**
   * Find or create a conversation between two participants for an opportunity.
   * Roles (owner/applicant) are assigned from the opportunity creator.
   */
  static async findOrCreate(opportunityId, userA, userB, subject = '') {
    const idA = String(userA);
    const idB = String(userB);

    const existing = await db.query(
      `SELECT c.* FROM conversations c
       WHERE c.opportunity_id = $1
         AND EXISTS (
           SELECT 1 FROM conversation_participants cp
           WHERE cp.conversation_id = c.id AND cp.user_id = $2 AND cp.deleted_at IS NULL
         )
         AND EXISTS (
           SELECT 1 FROM conversation_participants cp
           WHERE cp.conversation_id = c.id AND cp.user_id = $3 AND cp.deleted_at IS NULL
         )
       LIMIT 1`,
      [opportunityId, idA, idB]
    );
    if (existing.rows.length > 0) return new Conversation(existing.rows[0]);

    const oppResult = await db.query(
      'SELECT created_by, title FROM opportunities WHERE id = $1 LIMIT 1',
      [opportunityId]
    );
    const ownerId = oppResult.rows[0]?.created_by ? String(oppResult.rows[0].created_by) : null;

    const convResult = await db.query(
      `INSERT INTO conversations (opportunity_id, subject)
       VALUES ($1, $2) RETURNING *`,
      [opportunityId, subject || `Re: ${oppResult.rows[0]?.title || 'Opportunity'}`]
    );
    const conv = new Conversation(convResult.rows[0]);

    const roleFor = (userId) => (ownerId && String(userId) === ownerId ? 'owner' : 'applicant');

    await db.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES
       ($1, $2, $3),
       ($1, $4, $5)`,
      [conv.id, idA, roleFor(idA), idB, roleFor(idB)]
    );

    return conv;
  }

  static async findByUser(userId, { search, status, opportunityId } = {}) {
    const params = [userId];
    let where = 'cp.deleted_at IS NULL AND cp.user_id = $1';

    if (opportunityId) {
      params.push(opportunityId);
      where += ` AND c.opportunity_id = $${params.length}`;
    }
    if (status === 'archived') {
      where += ' AND cp.is_archived = TRUE';
    } else {
      where += ' AND cp.is_archived = FALSE';
    }

    let searchClause = '';
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      searchClause = ` AND (
        u.name ILIKE $${idx}
        OR o.title ILIKE $${idx}
        OR o.company ILIKE $${idx}
        OR EXISTS (
          SELECT 1 FROM messages ms
          WHERE ms.conversation_id = c.id AND ms.message_body ILIKE $${idx}
        )
      )`;
    }

    const result = await db.query(
      `WITH latest_msg AS (
         SELECT m.conversation_id, m.message_body, m.created_at, m.sender_id,
                ROW_NUMBER() OVER (PARTITION BY m.conversation_id ORDER BY m.created_at DESC) AS rn
         FROM messages m
       )
       SELECT c.id, c.opportunity_id, c.subject, c.created_at, c.updated_at,
              o.title AS opportunity_title, o.company AS opportunity_company,
              u.id AS other_user_id, u.name AS other_user_name, u.avatar AS other_user_avatar,
              cp.is_archived, cp.last_read_at,
              lm.message_body AS last_message, lm.created_at AS last_message_at, lm.sender_id AS last_sender_id,
              COALESCE(un.unread, 0) AS unread_count
       FROM conversation_participants cp
       JOIN conversations c ON c.id = cp.conversation_id
       JOIN opportunities o ON o.id = c.opportunity_id
       JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != $1 AND cp_other.deleted_at IS NULL
       JOIN users u ON u.id = cp_other.user_id
       LEFT JOIN latest_msg lm ON lm.conversation_id = c.id AND lm.rn = 1
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS unread
         FROM messages m
         WHERE m.conversation_id = c.id AND m.receiver_id = $1 AND m.read_at IS NULL
       ) un ON TRUE
       WHERE ${where}${searchClause}
       ORDER BY COALESCE(lm.created_at, c.updated_at) DESC`,
      params
    );
    return result.rows;
  }

  static async findById(conversationId, userId) {
    const result = await db.query(
      `SELECT c.*, o.title AS opportunity_title, o.company AS opportunity_company
       FROM conversations c
       JOIN opportunities o ON o.id = c.opportunity_id
       JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2 AND cp.deleted_at IS NULL
       WHERE c.id = $1
       LIMIT 1`,
      [conversationId, userId]
    );
    return result.rows[0] || null;
  }

  static async getParticipants(conversationId) {
    const result = await db.query(
      `SELECT cp.*, u.name, u.email, u.avatar
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.conversation_id = $1 AND (cp.deleted_at IS NULL)
       ORDER BY cp.joined_at ASC`,
      [conversationId]
    );
    const { getContactsMap } = require('../services/userContactService');
    const contacts = await getContactsMap(result.rows.map((row) => row.user_id));
    return result.rows.map((row) => {
      const contact = contacts[String(row.user_id)] || { phone: null, whatsappOptIn: false };
      return {
        ...row,
        phone: contact.phone,
        whatsapp_opt_in: contact.whatsappOptIn,
      };
    });
  }

  static async archive(conversationId, userId) {
    await db.query(
      `UPDATE conversation_participants SET is_archived = TRUE
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  static async unarchive(conversationId, userId) {
    await db.query(
      `UPDATE conversation_participants SET is_archived = FALSE
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  static async softDelete(conversationId, userId) {
    await db.query(
      `UPDATE conversation_participants SET deleted_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  static async addTimelineEvent(conversationId, eventType, description, actorId = null) {
    await db.query(
      `INSERT INTO conversation_timeline (conversation_id, event_type, description, actor_id)
       VALUES ($1, $2, $3, $4)`,
      [conversationId, eventType, description, actorId]
    );
  }

  static async getTimeline(conversationId) {
    const result = await db.query(
      `SELECT ct.*, u.name AS actor_name
       FROM conversation_timeline ct
       LEFT JOIN users u ON u.id = ct.actor_id
       WHERE ct.conversation_id = $1
       ORDER BY ct.created_at ASC`,
      [conversationId]
    );
    return result.rows;
  }

  static toJSON(row) {
    return {
      id: row.id,
      opportunityId: row.opportunity_id,
      subject: row.subject,
      opportunityTitle: row.opportunity_title,
      opportunityCompany: row.opportunity_company,
      otherUserId: row.other_user_id,
      otherUserName: row.other_user_name,
      otherUserAvatar: row.other_user_avatar,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      lastSenderId: row.last_sender_id,
      unreadCount: row.unread_count,
      isArchived: row.is_archived,
      lastReadAt: row.last_read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = Conversation;
