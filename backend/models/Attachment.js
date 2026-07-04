const db = require('../db');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/zip',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

class Attachment {
  static async create({ messageId, fileName, filePath, fileType, fileSize }) {
    const result = await db.query(
      `INSERT INTO message_attachments (message_id, file_name, file_path, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [messageId, fileName, filePath, fileType, fileSize]
    );
    return result.rows[0];
  }

  static async findByMessage(messageId) {
    const result = await db.query(
      'SELECT * FROM message_attachments WHERE message_id = $1 ORDER BY created_at ASC',
      [messageId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM message_attachments WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async deleteFile(id) {
    const attachment = await Attachment.findById(id);
    if (!attachment) return false;
    try {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
    } catch { /* ignore */ }
    await db.query('DELETE FROM message_attachments WHERE id = $1', [id]);
    return true;
  }

  static validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed: PDF, DOCX, images, ZIP`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB`);
    }
    return true;
  }

  static toJSON(row) {
    return {
      id: row.id,
      messageId: row.message_id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      createdAt: row.created_at,
    };
  }
}

Attachment.ALLOWED_TYPES = ALLOWED_TYPES;
Attachment.MAX_SIZE = MAX_SIZE;

module.exports = Attachment;
