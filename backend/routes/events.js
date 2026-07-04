const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { protect, admin, optionalAuth } = require('../middleware/auth');
const { sameUserId } = require('../utils/ownership');

const router = express.Router();

const EVENT_CATEGORIES = [
  'conference', 'workshop', 'meetup', 'networking', 'cultural', 
  'sports', 'educational', 'concert', 'seminar', 'webinar', 
  'exhibition', 'gala', 'party', 'religious', 'political', 'other'
];

// @route   GET /api/events
// @desc    Get all upcoming events (public)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { category, location, search } = req.query;
    const userId = req.user?.id || req.user?._id || null;

    const { events, total } = await Event.findUpcomingPaginated({
      page,
      limit,
      category,
      location,
      search,
      userId,
    });

    res.json({
      message: 'Events retrieved successfully',
      events: events.map((e) => {
        const json = e.toJSON();
        if (userId) json.isOwner = sameUserId(e.createdBy, userId);
        return json;
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error retrieving events' });
  }
});

// @route   GET /api/events/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { events, total } = await Event.findByOwner(userId, {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    });
    res.json({ events: events.map((e) => e.toJSON()), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/registrations/received
router.get('/registrations/received', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const registrations = await Event.findRegistrationsByOwner(userId);
    res.json({ registrations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = req.user?.id || req.user?._id || null;
    const json = event.toJSON();
    if (userId) {
      json.isOwner = sameUserId(event.createdBy, userId);
      const attending = await require('../db').query(
        'SELECT 1 FROM event_attendees WHERE event_id = $1 AND user_id = $2 LIMIT 1',
        [req.params.id, userId]
      );
      json.isAttending = attending.rows.length > 0;
    }

    res.json({
      message: 'Event retrieved successfully',
      event: json,
    });
  } catch (error) {
    console.error('Get event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error retrieving event' });
  }
});

// @route   GET /api/events/:id/attendees
router.get('/:id/attendees', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const userId = req.user.id || req.user._id;
    if (!sameUserId(event.createdBy, userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const attendees = await Event.findAttendees(req.params.id);
    res.json({ attendees });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('date').isISO8601().withMessage('Valid event date is required'),
  body('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('organizer').trim().isLength({ min: 2, max: 100 }).withMessage('Organizer name must be between 2 and 100 characters'),
  body('contactInfo.email').isEmail().withMessage('Valid contact email is required'),
  body('category').optional().isIn(EVENT_CATEGORIES).withMessage(`Invalid event category. Must be one of: ${EVENT_CATEGORIES.join(', ')}`),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Maximum attendees must be at least 1')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      title,
      description,
      date,
      time,
      location,
      organizer,
      contactInfo,
      category,
      image,
      maxAttendees
    } = req.body;

    // Check if event date is in the future
    if (new Date(date) <= new Date()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      organizer,
      contactInfo,
      category: category || 'meetup',
      image: image || '',
      maxAttendees: maxAttendees || null,
      isActive: true,
      createdBy: req.user.id || req.user._id,
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event: event.toJSON(),
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event (creator or admin)
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('date').optional().isISO8601().withMessage('Valid event date is required'),
  body('time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
  body('location').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('organizer').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Organizer name must be between 2 and 100 characters'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid contact email is required'),
  body('category').optional().isIn(EVENT_CATEGORIES).withMessage(`Invalid event category. Must be one of: ${EVENT_CATEGORIES.join(', ')}`),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Maximum attendees must be at least 1')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy !== (req.user.id || req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updates = req.body;

    // Check if event date is in the future if provided
    if (updates.date && new Date(updates.date) <= new Date()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key === 'contactInfo' && typeof updates[key] === 'object') {
        event.contactEmail = updates.contactInfo.email || event.contactEmail;
        event.contactPhone = updates.contactInfo.phone || event.contactPhone;
      } else if (key === 'maxAttendees') {
        event.maxAttendees = updates.maxAttendees;
      } else {
        event[key] = updates[key];
      }
    });

    await event.save();

    res.json({
      message: 'Event updated successfully',
      event: event.toJSON(),
    });
  } catch (error) {
    console.error('Update event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (creator or admin)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator or admin
    if (event.createdBy !== (req.user.id || req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.deleteById(req.params.id);

    res.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// @route   POST /api/events/:id/attend
// @desc    Attend/unattend an event
// @access  Private
router.post('/:id/attend', protect, async (req, res) => {
  try {
    try {
      const result = await Event.toggleAttendance({
        eventId: req.params.id,
        userId: req.user.id || req.user._id,
      });

      res.json({
        message: result.attending
          ? 'Successfully registered for event'
          : 'Successfully unattended from event',
        attending: result.attending,
        currentAttendees: result.currentAttendees,
        maxAttendees: result.maxAttendees,
      });
    } catch (err) {
      if (err.message === 'EventNotFound') {
        return res.status(404).json({ message: 'Event not found' });
      }
      if (err.message === 'EventInactive') {
        return res.status(400).json({ message: 'Event is no longer active' });
      }
      if (err.message === 'EventInPast') {
        return res.status(400).json({ message: 'Cannot attend past events' });
      }
      if (err.message === 'EventFull') {
        return res.status(400).json({ message: 'Event is full' });
      }
      if (err.message === 'SelfRegister') {
        return res.status(400).json({ message: 'You cannot register for your own event' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Attend event error:', error);
    res.status(500).json({ message: 'Server error attending event' });
  }
});

module.exports = router;
