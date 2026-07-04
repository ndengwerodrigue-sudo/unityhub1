const express = require('express');
const { body, validationResult } = require('express-validator');
const Opportunity = require('../models/Opportunity');
const OpportunityApplication = require('../models/OpportunityApplication');
const Conversation = require('../models/Conversation');
const { protect, optionalAuth } = require('../middleware/auth');
const { notifyNewApplication, notifyApplicationStatus, notifyApplicationWithdrawn } = require('../utils/notificationService');
const { sameUserId } = require('../utils/ownership');

const router = express.Router();

const OPPORTUNITY_TYPES = [
  'job', 'internship', 'scholarship', 'fellowship', 'grant',
  'competition', 'workshop', 'conference', 'training',
  'volunteering', 'hackathon', 'mentorship', 'freelance', 'funding',
];

const WORK_MODES = ['remote', 'hybrid', 'onsite'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'temporary', 'volunteer'];
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive', 'student'];

const ALLOWED_APP_STATUSES = OpportunityApplication.getAllowedStatuses();

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

// @route   GET /api/opportunities/hub/stats
router.get('/hub/stats', async (req, res) => {
  try {
    const stats = await Opportunity.getHubStats();
    res.json({ stats });
  } catch (error) {
    console.error('Hub stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/recommended
router.get('/recommended', optionalAuth, async (req, res) => {
  try {
    const items = await Opportunity.recommendForUser(req.user, 6);
    res.json({ opportunities: items.map((o) => o.toJSON()) });
  } catch (error) {
    console.error('Recommend opportunities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/saved
router.get('/saved/list', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const items = await Opportunity.findSavedByUser(userId);
    res.json({ opportunities: items.map((o) => o.toJSON()) });
  } catch (error) {
    console.error('Saved opportunities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/applications/me
router.get('/applications/me', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const applications = await OpportunityApplication.findByApplicant(userId);
    res.json({ applications });
  } catch (error) {
    console.error('My applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/applications/received
router.get('/applications/received', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { applications, total, page, limit } = await OpportunityApplication.findReceivedByOwner(userId, {
      status: req.query.status?.trim() || undefined,
      opportunityId: req.query.opportunityId?.trim() || undefined,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    });
    res.json({ applications, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Received applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/applications/:appId
router.get('/applications/:appId', protect, async (req, res) => {
  try {
    const application = await OpportunityApplication.findById(req.params.appId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const userId = getUserId(req);
    const isApplicant = sameUserId(application.applicantId, userId);
    const isOwner = sameUserId(application.opportunityOwnerId, userId);
    if (!isApplicant && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let previousApplications = [];
    if (isOwner || req.user.role === 'admin') {
      previousApplications = await OpportunityApplication.findPreviousByApplicant(
        application.applicantId,
        application.id
      );
    }

    const { getContact } = require('../services/userContactService');
    const [applicantContact, ownerContact] = await Promise.all([
      getContact(application.applicantId),
      getContact(application.opportunityOwnerId),
    ]);

    res.json({
      application: {
        ...application,
        applicantContact,
        ownerContact,
      },
      previousApplications,
    });
  } catch (error) {
    console.error('Application detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/mine/stats
router.get('/mine/stats', protect, async (req, res) => {
  try {
    const stats = await Opportunity.getOwnerStats(getUserId(req));
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { opportunities, total, page, limit } = await Opportunity.findByOwner(userId, {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 12,
      status: req.query.status?.trim() || undefined,
    });
    res.json({
      opportunities: opportunities.map((o) => o.toJSON()),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('My opportunities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/opportunities
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || null;
    const { opportunities, total, page, limit } = await Opportunity.findActivePaginated({
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 12,
      type: req.query.type?.trim() || undefined,
      location: req.query.location?.trim() || undefined,
      search: req.query.search?.trim() || undefined,
      workMode: req.query.workMode?.trim() || undefined,
      employmentType: req.query.employmentType?.trim() || undefined,
      experienceLevel: req.query.experienceLevel?.trim() || undefined,
      salaryMin: req.query.salaryMin ? Number(req.query.salaryMin) : undefined,
      includeInactive: req.query.includeInactive === 'true',
      userId,
    });

    res.json({
      message: 'Opportunities retrieved successfully',
      opportunities: opportunities.map((o) => o.toJSON()),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ message: 'Server error retrieving opportunities' });
  }
});

// @route   GET /api/opportunities/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || null;
    const opportunity = await Opportunity.findById(req.params.id, userId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    await Opportunity.incrementView(req.params.id, userId);

    const json = opportunity.toJSON();
    let hasApplied = false;
    let userApplication = null;
    const isOwner = userId ? sameUserId(opportunity.createdBy, userId) : false;

    if (userId && !isOwner) {
      userApplication = await OpportunityApplication.findForApplicantOnOpportunity(req.params.id, userId);
      hasApplied = !!userApplication && userApplication.status !== 'withdrawn';
    }

    res.json({
      opportunity: {
        ...json,
        isOwner,
        hasApplied,
        userApplication,
      },
    });
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/opportunities/:id/save
router.post('/:id/save', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    const result = await Opportunity.toggleSaved(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/opportunities/:id/apply
router.post('/:id/apply', protect, [
  body('message').trim().isLength({ min: 20, max: 4000 }),
  body('applicantName').trim().isLength({ min: 2, max: 120 }),
  body('applicantEmail').isEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const userId = req.user.id || req.user._id;
    if (String(opportunity.createdBy) === String(userId)) {
      return res.status(400).json({ message: 'You cannot apply to your own opportunity' });
    }

    const json = opportunity.toJSON();
    if (!json.isOpen) {
      return res.status(400).json({ message: 'This opportunity is no longer accepting applications' });
    }

    if (await OpportunityApplication.existsForApplicant(req.params.id, userId)) {
      return res.status(400).json({ message: 'You have already applied' });
    }

    const application = await OpportunityApplication.create({
      opportunityId: req.params.id,
      applicantId: userId,
      applicantName: req.body.applicantName,
      applicantEmail: req.body.applicantEmail,
      phone: req.body.phone,
      message: req.body.message,
      portfolioUrl: req.body.portfolioUrl,
      resumeUrl: req.body.resumeUrl,
      coverLetterUrl: req.body.coverLetterUrl,
      linkedinUrl: req.body.linkedinUrl,
      githubUrl: req.body.githubUrl,
      websiteUrl: req.body.websiteUrl,
      answers: req.body.answers,
    });

    if (req.body.phone || req.body.whatsappOptIn !== undefined) {
      const { setContact } = require('../services/userContactService');
      await setContact(userId, {
        phone: req.body.phone,
        whatsappOptIn: req.body.whatsappOptIn !== false && !!req.body.phone,
      });
    }

    const conversation = await Conversation.findOrCreate(
      req.params.id,
      userId,
      opportunity.createdBy,
      `Application: ${json.title}`
    );

    await Conversation.addTimelineEvent(conversation.id, 'application_submitted', `${req.user.name} submitted an application for "${json.title}"`);

    const db = require('../db');
    await db.query('UPDATE opportunity_applications SET conversation_id = $1 WHERE id = $2', [conversation.id, application.id]);

    await notifyNewApplication({
      posterId: opportunity.createdBy,
      actor: { id: userId, name: req.user.name },
      opportunity: json,
      applicationId: application.id,
    });

    try {
      const User = require('../models/User');
      const poster = await User.findById(opportunity.createdBy);
      if (poster?.email) {
        const { sendApplicationNotification } = require('../services/emailService');
        await sendApplicationNotification({
          recipientEmail: poster.email,
          recipientName: poster.name,
          applicantName: req.body.applicantName,
          opportunityTitle: json.title,
          company: json.company,
          applicationId: application.id,
          messagePreview: req.body.message?.substring(0, 300),
        });
      }
    } catch (emailErr) {
      console.warn('Application email notification skipped:', emailErr.message);
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: OpportunityApplication.mapRow(application),
      posterEmail: json.posterEmail,
      posterName: json.posterName,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error('Apply error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'You have already applied' });
    }
    res.status(500).json({ message: 'Server error submitting application' });
  }
});

// @route   GET /api/opportunities/:id/applications
router.get('/:id/applications', protect, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Not found' });
    const userId = req.user.id || req.user._id;
    if (String(opportunity.createdBy) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const applications = await OpportunityApplication.findByOpportunity(req.params.id);
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/opportunities/applications/:appId/status
router.patch('/applications/:appId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_APP_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status', allowed: ALLOWED_APP_STATUSES });
    }

    const existing = await OpportunityApplication.findById(req.params.appId);
    if (!existing) return res.status(404).json({ message: 'Application not found' });

    const userId = getUserId(req);
    if (!sameUserId(existing.opportunityOwnerId, userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await OpportunityApplication.updateStatus(
      req.params.appId,
      status,
      userId
    );

    if (updated?.conversationId) {
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
      await Conversation.addTimelineEvent(
        updated.conversationId,
        'status_changed',
        `Application status updated to "${statusLabel}"`,
        userId
      );
    }

    const opportunity = await Opportunity.findById(updated.opportunityId);
    await notifyApplicationStatus({
      applicantId: updated.applicantId,
      opportunity: opportunity?.toJSON() || { id: updated.opportunityId, title: updated.opportunityTitle },
      status,
      actorId: userId,
      applicationId: updated.id,
    });

    res.json({ application: updated });
  } catch (error) {
    if (error.message === 'InvalidStatus') {
      return res.status(400).json({ message: 'Invalid status' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/opportunities/applications/:appId/notes
router.patch('/applications/:appId/notes', protect, async (req, res) => {
  try {
    const existing = await OpportunityApplication.findById(req.params.appId);
    if (!existing) return res.status(404).json({ message: 'Application not found' });

    const userId = getUserId(req);
    if (!sameUserId(existing.opportunityOwnerId, userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await OpportunityApplication.updateNotes(req.params.appId, req.body.notes);
    res.json({ application: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/opportunities/applications/:appId/withdraw
router.post('/applications/:appId/withdraw', protect, async (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = await OpportunityApplication.findById(req.params.appId);
    if (!existing) return res.status(404).json({ message: 'Application not found' });

    if (!sameUserId(existing.applicantId, userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await OpportunityApplication.withdraw(req.params.appId, userId);
    if (!updated) {
      return res.status(400).json({ message: 'Cannot withdraw this application' });
    }

    await notifyApplicationWithdrawn({
      posterId: existing.opportunityOwnerId,
      actor: { id: userId, name: req.user.name },
      opportunity: { id: existing.opportunityId, title: existing.opportunityTitle },
      applicationId: updated.id,
    });

    res.json({ application: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Not found' });
    const userId = req.user.id || req.user._id;
    if (String(opportunity.createdBy) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    opportunity.isActive = req.body.isActive !== undefined ? !!req.body.isActive : !opportunity.isActive;
    await opportunity.save();
    res.json({ opportunity: opportunity.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const {
      title, description, type, location, contactInfo, company, deadline,
      workMode, employmentType, experienceLevel, salaryMin, salaryMax, salaryCurrency,
      stipend, skills, tags, responsibilities, requirements, benefits, companyDescription,
      industry, applicationQuestions, requiredDocuments, maxApplicants, applicationProcess, faq,
    } = req.body;

    if (!title || !description || !type || !location || !company || !deadline) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }

    const opportunity = new Opportunity();
    Object.assign(opportunity, {
      title,
      description,
      type,
      location,
      company,
      deadline,
      contact: {
        email: contactInfo?.email || req.user.email,
        phone: contactInfo?.phone,
        website: contactInfo?.website,
      },
      workMode: workMode || 'onsite',
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      salaryCurrency,
      stipend,
      skills: Array.isArray(skills) ? skills : [],
      tags: Array.isArray(tags) ? tags : [],
      responsibilities,
      requirements,
      benefits,
      companyDescription,
      industry,
      applicationQuestions: applicationQuestions || [],
      requiredDocuments: requiredDocuments || [],
      maxApplicants,
      applicationProcess,
      faq: faq || [],
      status: req.user.role === 'admin' ? 'published' : 'published',
      createdBy: req.user.id || req.user._id,
    });

    await opportunity.save();
    const full = await Opportunity.findById(opportunity.id);
    res.status(201).json({ opportunity: (full || opportunity).toJSON() });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ message: 'Server error creating opportunity' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Not found' });
    const userId = req.user.id || req.user._id;
    if (String(opportunity.createdBy) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const u = req.body;
    if (u.title !== undefined) opportunity.title = u.title;
    if (u.description !== undefined) opportunity.description = u.description;
    if (u.type !== undefined) opportunity.type = u.type;
    if (u.location !== undefined) opportunity.location = u.location;
    if (u.company !== undefined) opportunity.company = u.company;
    if (u.deadline !== undefined) opportunity.deadline = u.deadline;
    if (u.contactInfo) opportunity.contact = { ...opportunity.contact, ...u.contactInfo };
    if (u.workMode !== undefined) opportunity.workMode = u.workMode;
    if (u.employmentType !== undefined) opportunity.employmentType = u.employmentType;
    if (u.experienceLevel !== undefined) opportunity.experienceLevel = u.experienceLevel;
    if (u.salaryMin !== undefined) opportunity.salaryMin = u.salaryMin;
    if (u.salaryMax !== undefined) opportunity.salaryMax = u.salaryMax;
    if (u.skills !== undefined) opportunity.skills = u.skills;
    if (u.tags !== undefined) opportunity.tags = u.tags;
    if (u.responsibilities !== undefined) opportunity.responsibilities = u.responsibilities;
    if (u.requirements !== undefined) opportunity.requirements = u.requirements;
    if (u.benefits !== undefined) opportunity.benefits = u.benefits;
    if (u.companyDescription !== undefined) opportunity.companyDescription = u.companyDescription;
    if (u.applicationQuestions !== undefined) opportunity.applicationQuestions = u.applicationQuestions;
    if (u.requiredDocuments !== undefined) opportunity.requiredDocuments = u.requiredDocuments;
    if (u.maxApplicants !== undefined) opportunity.maxApplicants = u.maxApplicants;
    if (u.applicationProcess !== undefined) opportunity.applicationProcess = u.applicationProcess;
    if (u.faq !== undefined) opportunity.faq = u.faq;
    if (req.user.role === 'admin' && u.isFeatured !== undefined) opportunity.isFeatured = u.isFeatured;
    if (req.user.role === 'admin' && u.isVerified !== undefined) opportunity.isVerified = u.isVerified;

    await opportunity.save();
    res.json({ opportunity: opportunity.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const source = await Opportunity.findById(req.params.id);
    if (!source) return res.status(404).json({ message: 'Not found' });
    const userId = getUserId(req);
    if (!sameUserId(source.createdBy, userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const copy = new Opportunity();
    Object.assign(copy, {
      title: `${source.title} (Copy)`,
      description: source.description,
      type: source.type,
      location: source.location,
      company: source.company,
      deadline: source.deadline,
      contact: { ...source.contact },
      workMode: source.workMode,
      employmentType: source.employmentType,
      experienceLevel: source.experienceLevel,
      salaryMin: source.salaryMin,
      salaryMax: source.salaryMax,
      salaryCurrency: source.salaryCurrency,
      stipend: source.stipend,
      skills: [...(source.skills || [])],
      tags: [...(source.tags || [])],
      responsibilities: source.responsibilities,
      requirements: source.requirements,
      benefits: source.benefits,
      companyDescription: source.companyDescription,
      industry: source.industry,
      applicationQuestions: [...(source.applicationQuestions || [])],
      requiredDocuments: [...(source.requiredDocuments || [])],
      maxApplicants: source.maxApplicants,
      applicationProcess: source.applicationProcess,
      faq: [...(source.faq || [])],
      status: 'draft',
      isActive: false,
      createdBy: userId,
    });
    await copy.save();
    const full = await Opportunity.findById(copy.id);
    res.status(201).json({ opportunity: (full || copy).toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Not found' });
    const userId = req.user.id || req.user._id;
    if (String(opportunity.createdBy) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await require('../db').query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
