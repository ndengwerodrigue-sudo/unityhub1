const express = require('express');
const { body, validationResult } = require('express-validator');
const Business = require('../models/Business');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

const BUSINESS_CATEGORIES = [
  'technology', 'retail', 'services', 'manufacturing', 'agriculture', 
  'healthcare', 'education', 'finance', 'hospitality', 'real estate', 
  'logistics', 'energy', 'media', 'construction', 'legal', 
  'consulting', 'non-profit', 'other'
];

// @route   GET /api/businesses
// @desc    Get all businesses (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const category = req.query.category?.trim() || undefined;
    const location = req.query.location?.trim() || undefined;
    const search = req.query.search?.trim() || undefined;
    const verifiedRaw = req.query.verified?.trim();
    const verified = verifiedRaw === '' || verifiedRaw === undefined
      ? undefined
      : verifiedRaw === 'true';

    const { businesses, total } = await Business.findActivePaginated({
      page,
      limit,
      category,
      location,
      search,
      verified,
    });

    res.json({
      message: 'Businesses retrieved successfully',
      businesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ message: 'Server error retrieving businesses' });
  }
});

// @route   GET /api/businesses/:id
// @desc    Get business by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (!business.isActive) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({
      message: 'Business retrieved successfully',
      business
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ message: 'Server error retrieving business' });
  }
});

// @route   POST /api/businesses
// @desc    Create a new business
// @access  Private
router.post('/', protect, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Business name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').isIn(BUSINESS_CATEGORIES).withMessage(`Invalid business category. Must be one of: ${BUSINESS_CATEGORIES.join(', ')}`),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('contact.email').isEmail().withMessage('Valid contact email is required'),
  body('contact.phone').trim().isLength({ min: 9, max: 20 }).withMessage('Valid contact phone is required')
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
      name,
      description,
      category,
      location,
      contact,
      logo,
      images,
      socialMedia
    } = req.body;

    const business = new Business();
    business.name = name;
    business.description = description;
    business.category = category;
    business.location = location;
    business.contact = {
      email: contact?.email,
      phone: contact?.phone,
      website: contact?.website,
      address: contact?.address,
    };
    business.logo = logo || '';
    business.images = Array.isArray(images) ? images : [];
    business.socialMedia = socialMedia || {};
    business.createdBy = req.user.id || req.user._id;

    res.status(201).json({
      message: 'Business created successfully',
      business: (await business.save())
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ message: 'Server error creating business' });
  }
});

// @route   PUT /api/businesses/:id
// @desc    Update business (creator or admin)
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Business name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').optional().isIn(BUSINESS_CATEGORIES).withMessage(`Invalid business category. Must be one of: ${BUSINESS_CATEGORIES.join(', ')}`),
  body('location').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('contact.email').optional().isEmail().withMessage('Valid contact email is required'),
  body('contact.phone').optional().trim().isLength({ min: 9, max: 20 }).withMessage('Valid contact phone is required')
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

    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if user is the creator or admin
    if (business.createdBy !== (req.user.id || req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    const updates = req.body;

    if (updates.name !== undefined) business.name = updates.name;
    if (updates.description !== undefined) business.description = updates.description;
    if (updates.category !== undefined) business.category = updates.category;
    if (updates.location !== undefined) business.location = updates.location;
    if (updates.logo !== undefined) business.logo = updates.logo;
    if (updates.images !== undefined) business.images = Array.isArray(updates.images) ? updates.images : [];
    if (updates.contact !== undefined) {
      business.contact = {
        email: updates.contact.email ?? business.contact.email,
        phone: updates.contact.phone ?? business.contact.phone,
        website: updates.contact.website ?? business.contact.website,
        address: updates.contact.address ?? business.contact.address,
      };
    }
    if (updates.socialMedia !== undefined) {
      business.socialMedia = { ...(business.socialMedia || {}), ...(updates.socialMedia || {}) };
    }

    await business.save();

    res.json({
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ message: 'Server error updating business' });
  }
});

// @route   DELETE /api/businesses/:id
// @desc    Delete business (creator or admin)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if user is the creator or admin
    if (business.createdBy !== (req.user.id || req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this business' });
    }

    await require('../db').query('DELETE FROM businesses WHERE id = $1', [req.params.id]);

    res.json({
      message: 'Business deleted successfully'
    });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ message: 'Server error deleting business' });
  }
});

// @route   PUT /api/businesses/:id/verify
// @desc    Verify business (admin only)
// @access  Private/Admin
router.put('/:id/verify', protect, admin, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    business.verified = true;
    await business.save();

    res.json({
      message: 'Business verified successfully',
      business
    });
  } catch (error) {
    console.error('Verify business error:', error);
    res.status(500).json({ message: 'Server error verifying business' });
  }
});

module.exports = router;
