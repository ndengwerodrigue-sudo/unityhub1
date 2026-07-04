const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Attachment = require('../models/Attachment');
const { protect } = require('../middleware/auth');

const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'message-attachments');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Attachment.MAX_SIZE },
  fileFilter: (req, file, cb) => {
    try {
      Attachment.validateFile(file);
      cb(null, true);
    } catch (err) {
      cb(new Error(err.message), false);
    }
  },
});

// GET /api/messages/unread-count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const count = await Message.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/unread-by-conversation
router.get('/unread-by-conversation', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const rows = await Message.getUnreadByConversation(userId);
    const map = {};
    rows.forEach((r) => { map[r.conversation_id] = r.count; });
    res.json({ unreadByConversation: map });
  } catch (error) {
    console.error('Unread by conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/upload — upload file attachment
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const attachment = await Attachment.create({
      messageId: req.body.messageId || null,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });
    res.status(201).json({ attachment: Attachment.toJSON(attachment) });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(400).json({ message: error.message || 'Upload failed' });
  }
});

// POST /api/messages/send — backward-compatible send (auto-creates or finds conversation)
router.post('/send', protect, [
  body('opportunityId').notEmpty().withMessage('Opportunity ID is required'),
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('message').trim().isLength({ min: 1, max: 10000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const senderId = getUserId(req);
    const { opportunityId, receiverId, message, messageType, sendEmail } = req.body;

    const Opportunity = require('../models/Opportunity');
    const opp = await Opportunity.findById(opportunityId);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

    const conversation = await Conversation.findOrCreate(
      opportunityId,
      senderId,
      receiverId,
      `Message: ${opp.title}`
    );

    const msg = await Message.create({
      conversationId: conversation.id,
      senderId,
      receiverId,
      messageBody: message,
      messageType: messageType === 'both' ? 'internal' : (messageType || 'internal'),
    });

    if (sendEmail || messageType === 'email' || messageType === 'both') {
      const { sendEmail: sendEmailService } = require('../services/emailService');
      const db = require('../db');
      const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [receiverId]);
      const recipient = userResult.rows[0];
      if (recipient) {
        const result = await sendEmailService({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          senderName: req.user.name,
          senderEmail: req.user.email,
          subject: `New message regarding: ${opp.title}`,
          messageBody: message,
          opportunityTitle: opp.title,
          company: opp.company,
          messageId: msg.id,
          conversationId: conversation.id,
        });
        if (result.status === 'sent') {
          await Message.updateDeliveryStatus(msg.id, 'delivered');
        }
      }
    }

    await Conversation.addTimelineEvent(conversation.id, 'message_sent', `${req.user.name} sent a message`, senderId);

    const { notifyMessageReceived } = require('../utils/notificationService');
    await notifyMessageReceived({
      receiverId,
      actor: { id: senderId, name: req.user.name },
      conversation: { opportunity_title: opp.title },
      messagePreview: message.substring(0, 100),
    });

    const fullMsg = await Message.findByConversation(conversation.id, senderId, { limit: 1 });
    const messageJson = fullMsg.messages.length > 0 ? Message.toJSON(fullMsg.messages[fullMsg.messages.length - 1]) : null;

    res.status(201).json({ message: messageJson || Message.toJSON(msg), conversationId: conversation.id });
  } catch (error) {
    console.error('Send message (legacy) error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/search — search messages
router.get('/search', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { q, page, limit } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    const results = await Message.searchMessages(userId, q.trim(), {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    res.json({ messages: results.map(Message.toJSON) });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/messages/:id/read — mark single message as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const msg = await Message.markAsRead(req.params.id, userId);
    if (!msg) return res.status(404).json({ message: 'Message not found or already read' });
    res.json({ message: Message.toJSON(msg) });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/:id/retry — retry failed message delivery
router.post('/:id/retry', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const msg = await Message.updateDeliveryStatus(req.params.id, 'queued');
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.sender_id) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ message: Message.toJSON(msg) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/:id/attachments
router.get('/:id/attachments', protect, async (req, res) => {
  try {
    const attachments = await Attachment.findByMessage(req.params.id);
    res.json({ attachments: attachments.map(Attachment.toJSON) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/:id — get single message
router.get('/:id', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const db = require('../db');
    const result = await db.query(
      `SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $2 AND cp.deleted_at IS NULL
       WHERE m.id = $1 LIMIT 1`,
      [req.params.id, userId]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Message not found' });
    const attachments = await Attachment.findByMessage(req.params.id);
    res.json({ message: Message.toJSON(result.rows[0]), attachments: attachments.map(Attachment.toJSON) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
