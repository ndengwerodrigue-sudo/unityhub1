const db = require('../db');

const APPLICATION_STATUSES = [
  'pending', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn',
];

function generateApplicationNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UH-${ts}-${rand}`;
}

const APPLICANT_PROFILE_JOIN = `
  LEFT JOIN users u ON u.id = a.applicant_id
`;

const APPLICANT_PROFILE_SELECT = `
  u.avatar AS applicant_avatar,
  u.location AS applicant_location,
  u.bio AS applicant_bio,
  u.role AS applicant_role
`;

class OpportunityApplication {
  static getAllowedStatuses() {
    return APPLICATION_STATUSES;
  }

  static normalizeStatus(status) {
    if (status === 'submitted') return 'pending';
    if (status === 'interview_scheduled') return 'interview';
    return status || 'pending';
  }

  static async create({
    opportunityId,
    applicantId,
    applicantName,
    applicantEmail,
    phone,
    message,
    portfolioUrl,
    resumeUrl,
    coverLetterUrl,
    linkedinUrl,
    githubUrl,
    websiteUrl,
    answers,
  }) {
    const applicationNumber = generateApplicationNumber();
    const result = await db.query(
      `INSERT INTO opportunity_applications (
         opportunity_id, applicant_id, applicant_name, applicant_email,
         phone, message, portfolio_url, resume_url, cover_letter_url,
         linkedin_url, github_url, website_url, answers, application_number, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,'pending')
       RETURNING *`,
      [
        opportunityId,
        applicantId,
        applicantName,
        applicantEmail,
        phone || null,
        message,
        portfolioUrl || null,
        resumeUrl || null,
        coverLetterUrl || null,
        linkedinUrl || null,
        githubUrl || null,
        websiteUrl || null,
        JSON.stringify(answers || {}),
        applicationNumber,
      ]
    );

    await db.query(
      `UPDATE opportunities SET application_count = COALESCE(application_count, 0) + 1 WHERE id = $1`,
      [opportunityId]
    );

    return result.rows[0];
  }

  static async existsForApplicant(opportunityId, applicantId) {
    const result = await db.query(
      `SELECT 1 FROM opportunity_applications
       WHERE opportunity_id = $1 AND applicant_id = $2
         AND status != 'withdrawn'
       LIMIT 1`,
      [opportunityId, applicantId]
    );
    return result.rows.length > 0;
  }

  static async findForApplicantOnOpportunity(opportunityId, applicantId) {
    const result = await db.query(
      `SELECT a.* FROM opportunity_applications a
       WHERE a.opportunity_id = $1 AND a.applicant_id = $2
       ORDER BY a.created_at DESC LIMIT 1`,
      [opportunityId, applicantId]
    );
    return result.rows[0] ? OpportunityApplication.mapRow(result.rows[0]) : null;
  }

  static async findByApplicant(userId) {
    const result = await db.query(
      `SELECT a.*, o.title AS opportunity_title, o.company, o.type AS opportunity_type,
              o.deadline AS opportunity_deadline, o.location AS opportunity_location,
              o.created_by AS opportunity_owner_id
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.applicant_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return result.rows.map(OpportunityApplication.mapRow);
  }

  static async findByOpportunity(opportunityId) {
    const result = await db.query(
      `SELECT a.*, ${APPLICANT_PROFILE_SELECT}
       FROM opportunity_applications a
       ${APPLICANT_PROFILE_JOIN}
       WHERE a.opportunity_id = $1
       ORDER BY a.created_at DESC`,
      [opportunityId]
    );
    return result.rows.map(OpportunityApplication.mapRow);
  }

  static async findReceivedByOwner(ownerId, { status, opportunityId, page = 1, limit = 20 } = {}) {
    const params = [ownerId];
    const where = ['o.created_by = $1'];

    if (status) {
      params.push(status);
      where.push(`a.status = $${params.length}`);
    }
    if (opportunityId) {
      params.push(opportunityId);
      where.push(`a.opportunity_id = $${params.length}`);
    }

    const whereSql = where.join(' AND ');
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE ${whereSql}`,
      params
    );
    const total = countResult.rows[0].count;

    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const result = await db.query(
      `SELECT a.*, o.title AS opportunity_title, o.company, o.type AS opportunity_type,
              o.deadline AS opportunity_deadline, o.location AS opportunity_location,
              o.created_by AS opportunity_owner_id,
              ${APPLICANT_PROFILE_SELECT}
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       ${APPLICANT_PROFILE_JOIN}
       WHERE ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      applications: result.rows.map(OpportunityApplication.mapRow),
      total,
      page,
      limit,
    };
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT a.*, o.title AS opportunity_title, o.company, o.type AS opportunity_type,
              o.deadline AS opportunity_deadline, o.location AS opportunity_location,
              o.created_by AS opportunity_owner_id,
              ${APPLICANT_PROFILE_SELECT}
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       ${APPLICANT_PROFILE_JOIN}
       WHERE a.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] ? OpportunityApplication.mapRow(result.rows[0]) : null;
  }

  static async findPreviousByApplicant(applicantId, excludeId, limit = 5) {
    const result = await db.query(
      `SELECT a.*, o.title AS opportunity_title, o.company, o.type AS opportunity_type
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.applicant_id = $1 AND a.id != $2
       ORDER BY a.created_at DESC
       LIMIT $3`,
      [applicantId, excludeId, limit]
    );
    return result.rows.map(OpportunityApplication.mapRow);
  }

  static async updateStatus(id, status, reviewerId) {
    const normalized = OpportunityApplication.normalizeStatus(status);
    if (!APPLICATION_STATUSES.includes(normalized)) {
      throw new Error('InvalidStatus');
    }
    const result = await db.query(
      `UPDATE opportunity_applications
       SET status = $1, reviewer_id = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [normalized, reviewerId || null, id]
    );
    return result.rows[0] ? OpportunityApplication.mapRow(result.rows[0]) : null;
  }

  static async updateNotes(id, notes) {
    const result = await db.query(
      `UPDATE opportunity_applications
       SET owner_notes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes || null, id]
    );
    return result.rows[0] ? OpportunityApplication.mapRow(result.rows[0]) : null;
  }

  static async withdraw(id, applicantId) {
    const result = await db.query(
      `UPDATE opportunity_applications
       SET status = 'withdrawn', updated_at = NOW()
       WHERE id = $1 AND applicant_id = $2 AND status NOT IN ('accepted', 'rejected', 'withdrawn')
       RETURNING *`,
      [id, applicantId]
    );
    if (result.rows[0]) {
      await db.query(
        `UPDATE opportunities SET application_count = GREATEST(COALESCE(application_count, 1) - 1, 0)
         WHERE id = $1`,
        [result.rows[0].opportunity_id]
      );
    }
    return result.rows[0] ? OpportunityApplication.mapRow(result.rows[0]) : null;
  }

  static async countByOwner(ownerId) {
    const result = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE o.created_by = $1 AND a.status != 'withdrawn'`,
      [ownerId]
    );
    return result.rows[0].count;
  }

  static mapRow(row) {
    const status = OpportunityApplication.normalizeStatus(row.status);
    return {
      id: row.id,
      opportunityId: row.opportunity_id,
      applicantId: row.applicant_id,
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      phone: row.phone,
      message: row.message,
      portfolioUrl: row.portfolio_url,
      resumeUrl: row.resume_url,
      coverLetterUrl: row.cover_letter_url,
      linkedinUrl: row.linkedin_url,
      githubUrl: row.github_url,
      websiteUrl: row.website_url,
      answers: row.answers || {},
      applicationNumber: row.application_number,
      status,
      ownerNotes: row.owner_notes || '',
      reviewerId: row.reviewer_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      opportunityTitle: row.opportunity_title,
      company: row.company,
      opportunityType: row.opportunity_type,
      opportunityDeadline: row.opportunity_deadline,
      opportunityLocation: row.opportunity_location,
      opportunityOwnerId: row.opportunity_owner_id,
      conversationId: row.conversation_id,
      applicant: {
        avatar: row.applicant_avatar || '',
        location: row.applicant_location || '',
        bio: row.applicant_bio || '',
        role: row.applicant_role || '',
      },
    };
  }
}

module.exports = OpportunityApplication;
