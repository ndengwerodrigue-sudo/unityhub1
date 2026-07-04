const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect, admin } = require('../middleware/auth');
const { sameUserId } = require('../utils/ownership');

const router = express.Router();

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function authorizeParticipant(conversation, userId) {
  if (!conversation) return false;
  return true; // checked by the participant join in findById
}

// POST /api/conversations/start — open or create a conversation for an application
router.post('/start', protect, [
  body('opportunityId').notEmpty(),
  body('otherUserId').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = getUserId(req);
    const { opportunityId, otherUserId, applicationId } = req.body;

    const Opportunity = require('../models/Opportunity');
    const opp = await Opportunity.findById(opportunityId);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

    const isOwner = String(opp.createdBy) === String(userId);
    const isOtherOwner = String(opp.createdBy) === String(otherUserId);
    if (!isOwner && !isOtherOwner && req.user.role !== 'admin') {
      const db = require('../db');
      const appCheck = await db.query(
        `SELECT 1 FROM opportunity_applications
         WHERE opportunity_id = $1
           AND ((applicant_id = $2 AND $3 = $4) OR (applicant_id = $3 AND $2 = $4))
           AND status != 'withdrawn'
         LIMIT 1`,
        [opportunityId, userId, otherUserId, opp.createdBy]
      );
      if (!appCheck.rows.length) {
        return res.status(403).json({ message: 'Not authorized to start this conversation' });
      }
    }

    const conversation = await Conversation.findOrCreate(
      opportunityId,
      userId,
      otherUserId,
      `Re: ${opp.title}`
    );

    if (applicationId) {
      await require('../db').query(
        'UPDATE opportunity_applications SET conversation_id = $1 WHERE id = $2 AND conversation_id IS NULL',
        [conversation.id, applicationId]
      );
    }

    const participants = await Conversation.getParticipants(conversation.id);
    res.json({
      conversation: Conversation.toJSON({
        ...conversation,
        opportunity_title: opp.title,
        opportunity_company: opp.company,
        other_user_id: otherUserId,
        other_user_name: participants.find((p) => String(p.user_id) !== String(userId))?.name,
        other_user_avatar: participants.find((p) => String(p.user_id) !== String(userId))?.avatar,
        unread_count: 0,
        is_archived: false,
      }),
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/conversations — list user's conversations
router.get('/', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { search, status, opportunityId } = req.query;
    const rows = await Conversation.findByUser(userId, { search, status, opportunityId });
    const conversations = rows.map(Conversation.toJSON);
    res.json({ conversations });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/conversations/:id — get conversation details
router.get('/:id', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const participants = await Conversation.getParticipants(req.params.id);
    const timeline = await Conversation.getTimeline(req.params.id);
    res.json({ conversation: Conversation.toJSON(conversation), participants, timeline });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/conversations/:id/archive
router.patch('/:id/archive', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    await Conversation.archive(req.params.id, userId);
    res.json({ message: 'Archived' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/conversations/:id/unarchive
router.patch('/:id/unarchive', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    await Conversation.unarchive(req.params.id, userId);
    res.json({ message: 'Unarchived' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/conversations/:id — soft delete for current user
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    await Conversation.softDelete(req.params.id, userId);
    res.json({ message: 'Conversation hidden' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/conversations/:id/timeline
router.get('/:id/timeline', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const timeline = await Conversation.getTimeline(req.params.id);
    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, userId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const { page, limit } = req.query;
    const result = await Message.findByConversation(req.params.id, userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });
    await Message.markConversationAsRead(req.params.id, userId);
    res.json({ messages: result.messages.map(Message.toJSON), total: result.total });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/conversations/:id/messages — send message in conversation
router.post('/:id/messages', protect, [
  body('message').trim().isLength({ min: 1, max: 10000 }).withMessage('Message must be 1-10000 characters'),
  body('messageType').optional().isIn(['internal', 'email', 'both']),
  body('sendEmail').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const senderId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, senderId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const participants = await Conversation.getParticipants(req.params.id);
    const receiver = participants.find((p) => String(p.user_id) !== String(senderId));
    if (!receiver) return res.status(400).json({ message: 'No other participant found' });

    const messageType = req.body.messageType || 'internal';
    const msg = await Message.create({
      conversationId: req.params.id,
      senderId,
      receiverId: receiver.user_id,
      messageBody: req.body.message,
      messageType: messageType === 'both' ? 'internal' : messageType,
    });

    await Conversation.addTimelineEvent(req.params.id, 'message_sent', `${req.user.name} sent a message`, senderId);

    let emailResult = null;
    const sendEmail = req.body.sendEmail === true || messageType === 'email' || messageType === 'both';

    if (sendEmail) {
      const sender = participants.find((p) => String(p.user_id) === String(senderId));
      const { sendEmail: sendEmailService } = require('../services/emailService');
      emailResult = await sendEmailService({
        recipientEmail: receiver.email,
        recipientName: receiver.name,
        senderName: req.user.name,
        senderEmail: sender?.email,
        subject: `New message regarding: ${conversation.opportunity_title}`,
        messageBody: req.body.message,
        opportunityTitle: conversation.opportunity_title,
        company: conversation.opportunity_company,
        messageId: msg.id,
        conversationId: req.params.id,
      });
      if (messageType === 'email' || messageType === 'both') {
        await Message.updateDeliveryStatus(
          msg.id,
          emailResult.status === 'sent' ? 'delivered' : 'failed'
        );
        if (emailResult.status === 'sent') {
          await Conversation.addTimelineEvent(
            req.params.id,
            'email_sent',
            `Email notification sent to ${receiver.name}`,
            senderId
          );
        } else {
          await Conversation.addTimelineEvent(
            req.params.id,
            'email_failed',
            `Email could not be sent: ${emailResult.error || 'unknown error'}`,
            senderId
          );
        }
      }
    }

    const { notifyMessageReceived } = require('../utils/notificationService');
    await notifyMessageReceived({
      receiverId: receiver.user_id,
      actor: { id: senderId, name: req.user.name },
      conversation: conversation,
      messagePreview: req.body.message.substring(0, 100),
    });

    const fullMsg = await Message.findByConversation(req.params.id, senderId, { limit: 1 });
    const messageJson = fullMsg.messages.length > 0 ? Message.toJSON(fullMsg.messages[fullMsg.messages.length - 1]) : null;

    res.status(201).json({
      message: messageJson || Message.toJSON(msg),
      emailStatus: emailResult,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/conversations/:id/whatsapp-link
router.post('/:id/whatsapp-link', protect, async (req, res) => {
  try {
    const senderId = getUserId(req);
    const conversation = await Conversation.findById(req.params.id, senderId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const participants = await Conversation.getParticipants(req.params.id);
    const receiver = participants.find((p) => String(p.user_id) !== String(senderId));
    if (!receiver) return res.status(400).json({ message: 'No other participant found' });
    if (!receiver.phone) {
      return res.status(400).json({
        message: 'Recipient has no phone number on file. Ask them to add one in their profile.',
      });
    }
    if (!receiver.whatsapp_opt_in) return res.status(400).json({ message: 'Recipient has not opted in for WhatsApp' });

    const senderParticipant = participants.find((p) => String(p.user_id) === String(senderId));

    const { generateWhatsAppLink } = require('../services/whatsappService');
    const result = await generateWhatsAppLink({
      recipientPhone: receiver.phone,
      recipientName: receiver.name,
      senderName: req.user.name,
      opportunityTitle: conversation.opportunity_title,
      company: conversation.opportunity_company,
      customMessage: req.body.customMessage,
      conversationId: req.params.id,
      senderRole: senderParticipant?.role || null,
    });

    await Conversation.addTimelineEvent(req.params.id, 'whatsapp_contacted', `${req.user.name} contacted via WhatsApp`, senderId);

    res.json(result);
  } catch (error) {
    console.error('WhatsApp link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
