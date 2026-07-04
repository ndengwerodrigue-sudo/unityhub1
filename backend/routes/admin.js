const express = require('express');
const Opportunity = require('../models/Opportunity');
const OpportunityApplication = require('../models/OpportunityApplication');
const Event = require('../models/Event');
const { protect, admin } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.use(protect, admin);

// @route   GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    const [opps, apps, events, users] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM opportunities'),
      db.query('SELECT COUNT(*)::int AS count FROM opportunity_applications'),
      db.query('SELECT COUNT(*)::int AS count FROM events'),
      db.query('SELECT COUNT(*)::int AS count FROM users'),
    ]);
    res.json({
      stats: {
        opportunities: opps.rows[0].count,
        applications: apps.rows[0].count,
        events: events.rows[0].count,
        users: users.rows[0].count,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const [count, rows] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM opportunities'),
      db.query(
        `SELECT o.*, u.name AS creator_name, u.email AS creator_email
         FROM opportunities o JOIN users u ON u.id = o.created_by
         ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);
    res.json({
      opportunities: rows.rows.map((r) => new Opportunity(r).toJSON()),
      pagination: { total: count.rows[0].count, page, limit },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/applications
router.get('/applications', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const [count, rows] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM opportunity_applications'),
      db.query(
        `SELECT a.*, o.title AS opportunity_title, o.company, o.created_by AS opportunity_owner_id
         FROM opportunity_applications a
         JOIN opportunities o ON o.id = a.opportunity_id
         ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);
    res.json({
      applications: rows.rows.map(OpportunityApplication.mapRow),
      pagination: { total: count.rows[0].count, page, limit },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/events
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { events, total } = await Event.findAllPaginated({ page, limit, includeInactive: true });
    res.json({
      events: events.map((e) => e.toJSON()),
      pagination: { total, page, limit },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Messaging admin endpoints ---

// GET /api/admin/messages/conversations
router.get('/messages/conversations', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT c.*, o.title AS opportunity_title, o.company,
              (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id) AS message_count
       FROM conversations c
       JOIN opportunities o ON o.id = c.opportunity_id
       ORDER BY c.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await db.query('SELECT COUNT(*)::int AS count FROM conversations');
    res.json({
      conversations: result.rows,
      total: countResult.rows[0].count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (error) {
    console.error('Admin conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/messages/conversations/:id
router.get('/messages/conversations/:id', async (req, res) => {
  try {
    const convResult = await db.query(
      `SELECT c.*, o.title AS opportunity_title, o.company
       FROM conversations c
       JOIN opportunities o ON o.id = c.opportunity_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (convResult.rows.length === 0) return res.status(404).json({ message: 'Conversation not found' });

    const msgResult = await db.query(
      `SELECT m.*, u.name AS sender_name, u.email AS sender_email
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    const participantResult = await db.query(
      `SELECT cp.*, u.name, u.email
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.conversation_id = $1`,
      [req.params.id]
    );

    res.json({
      conversation: convResult.rows[0],
      messages: msgResult.rows,
      participants: participantResult.rows,
    });
  } catch (error) {
    console.error('Admin conversation detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/messages/email-logs
router.get('/messages/email-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const EmailLog = require('../models/EmailLog');
    const logs = await EmailLog.findAll({ page: parseInt(page, 10), limit: parseInt(limit, 10), status });
    res.json({
      logs: logs.map(EmailLog.toJSON),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (error) {
    console.error('Admin email logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/messages/conversations/:id — admin delete
router.delete('/messages/conversations/:id', async (req, res) => {
  try {
    const { notifyAdminReportedConversation } = require('../utils/notificationService');
    await db.query('DELETE FROM conversations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
