const db = require('../db');

function parseArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  return [val];
}

function parseJson(val, fallback = []) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

class Opportunity {
  constructor(row = {}) {
    this.id = row.id || null;
    this.title = row.title;
    this.description = row.description;
    this.type = row.type;
    this.location = row.location;
    this.contact = {
      email: row.email,
      phone: row.phone,
      website: row.website,
    };
    this.company = row.company;
    this.deadline = row.deadline;
    this.isActive = row.is_active ?? true;
    this.createdBy = row.created_by || null;
    this.createdAt = row.created_at || new Date();
    this.updatedAt = row.updated_at || new Date();

    this.workMode = row.work_mode || 'onsite';
    this.employmentType = row.employment_type || null;
    this.experienceLevel = row.experience_level || null;
    this.salaryMin = row.salary_min != null ? Number(row.salary_min) : null;
    this.salaryMax = row.salary_max != null ? Number(row.salary_max) : null;
    this.salaryCurrency = row.salary_currency || 'XAF';
    this.stipend = row.stipend || null;
    this.skills = parseArray(row.skills);
    this.tags = parseArray(row.tags);
    this.responsibilities = row.responsibilities || '';
    this.requirements = row.requirements || '';
    this.benefits = row.benefits || '';
    this.companyDescription = row.company_description || '';
    this.industry = row.industry || '';
    this.companyLogo = row.company_logo || '';
    this.isVerified = !!row.is_verified;
    this.isFeatured = !!row.is_featured;
    this.viewCount = Number(row.view_count) || 0;
    this.applicationCount = Number(row.application_count) || 0;
    this.applicationQuestions = parseJson(row.application_questions, []);
    this.requiredDocuments = parseJson(row.required_documents, []);
    this.maxApplicants = row.max_applicants != null ? Number(row.max_applicants) : null;
    this.applicationProcess = row.application_process || '';
    this.faq = parseJson(row.faq, []);
    this.status = row.status || 'published';
    this.isSaved = !!row.is_saved;

    if (row.creator_name) {
      this.creator = {
        name: row.creator_name,
        email: row.creator_email,
        avatar: row.creator_avatar,
        role: row.creator_role,
      };
    }
  }

  static buildWhere(filters = {}) {
    const whereParts = [];
    const params = [];

    if (!filters.includeInactive) {
      whereParts.push('o.is_active = TRUE');
    }
    if (!filters.includeExpired) {
      whereParts.push('o.deadline > NOW()');
    }
    if (filters.status) {
      params.push(filters.status);
      whereParts.push(`o.status = $${params.length}`);
    } else if (!filters.includeDrafts) {
      whereParts.push(`o.status = 'published'`);
    }

    if (filters.type) {
      params.push(filters.type);
      whereParts.push(`o.type = $${params.length}`);
    }
    if (filters.workMode) {
      params.push(filters.workMode);
      whereParts.push(`o.work_mode = $${params.length}`);
    }
    if (filters.employmentType) {
      params.push(filters.employmentType);
      whereParts.push(`o.employment_type = $${params.length}`);
    }
    if (filters.experienceLevel) {
      params.push(filters.experienceLevel);
      whereParts.push(`o.experience_level = $${params.length}`);
    }
    if (filters.location) {
      params.push(`%${filters.location}%`);
      whereParts.push(`o.location ILIKE $${params.length}`);
    }
    if (filters.salaryMin != null) {
      params.push(Number(filters.salaryMin));
      whereParts.push(`(o.salary_max IS NULL OR o.salary_max >= $${params.length})`);
    }
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      params.push(pattern, pattern, pattern, pattern);
      const base = params.length - 3;
      whereParts.push(`(
        o.title ILIKE $${base}
        OR o.description ILIKE $${base + 1}
        OR o.company ILIKE $${base + 2}
        OR EXISTS (SELECT 1 FROM unnest(o.skills) s WHERE s ILIKE $${base + 3})
      )`);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    return { whereSql, params };
  }

  static async findActivePaginated(filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const offset = (page - 1) * limit;
    const userId = filters.userId || null;

    const { whereSql, params } = Opportunity.buildWhere(filters);

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM opportunities o ${whereSql}`,
      params
    );
    const total = countResult.rows[0].count;

    const savedJoin = userId
      ? `LEFT JOIN opportunity_saved os ON os.opportunity_id = o.id AND os.user_id = $${params.length + 1}`
      : '';
    const savedSel = userId ? '(os.user_id IS NOT NULL) AS is_saved' : 'FALSE AS is_saved';
    const listParams = userId ? [...params, userId, limit, offset] : [...params, limit, offset];
    const limitIdx = params.length + (userId ? 2 : 1);
    const offsetIdx = limitIdx + 1;

    const result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email,
              u.avatar AS creator_avatar, u.role AS creator_role,
              ${savedSel}
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       ${savedJoin}
       ${whereSql}
       ORDER BY o.is_featured DESC, o.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    return {
      opportunities: result.rows.map((row) => new Opportunity(row)),
      total,
      page,
      limit,
    };
  }

  static async findById(id, userId = null) {
    const params = [id];
    const savedJoin = userId
      ? `LEFT JOIN opportunity_saved os ON os.opportunity_id = o.id AND os.user_id = $2`
      : '';
    const savedSel = userId ? '(os.user_id IS NOT NULL) AS is_saved' : 'FALSE AS is_saved';
    if (userId) params.push(userId);

    const result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email,
              u.avatar AS creator_avatar, u.role AS creator_role,
              ${savedSel}
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       ${savedJoin}
       WHERE o.id = $1
       LIMIT 1`,
      params
    );
    if (!result.rows.length) return null;
    return new Opportunity(result.rows[0]);
  }

  static async incrementView(id, userId = null) {
    await db.query(
      `INSERT INTO opportunity_views (opportunity_id, user_id) VALUES ($1, $2)`,
      [id, userId]
    );
    await db.query(
      `UPDATE opportunities SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1`,
      [id]
    );
  }

  static async toggleSaved(opportunityId, userId) {
    const existing = await db.query(
      `SELECT 1 FROM opportunity_saved WHERE opportunity_id = $1 AND user_id = $2`,
      [opportunityId, userId]
    );
    if (existing.rows.length) {
      await db.query(
        `DELETE FROM opportunity_saved WHERE opportunity_id = $1 AND user_id = $2`,
        [opportunityId, userId]
      );
      return { isSaved: false };
    }
    await db.query(
      `INSERT INTO opportunity_saved (user_id, opportunity_id) VALUES ($1, $2)`,
      [userId, opportunityId]
    );
    return { isSaved: true };
  }

  static async findSavedByUser(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email,
              u.avatar AS creator_avatar, u.role AS creator_role,
              TRUE AS is_saved, s.created_at AS saved_at
       FROM opportunity_saved s
       JOIN opportunities o ON o.id = s.opportunity_id
       JOIN users u ON u.id = o.created_by
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows.map((row) => new Opportunity(row));
  }

  static async recommendForUser(user, limit = 6) {
    const skills = parseArray(user?.skills);
    const params = [limit];
    let skillClause = '';
    if (skills.length) {
      params.unshift(`%${skills[0]}%`);
      skillClause = `AND (o.description ILIKE $1 OR EXISTS (SELECT 1 FROM unnest(o.skills) s WHERE s ILIKE $1))`;
    }

    const result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email,
              u.avatar AS creator_avatar, u.role AS creator_role
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       WHERE o.is_active = TRUE AND o.deadline > NOW() AND o.status = 'published'
       ${skillClause}
       ORDER BY o.is_featured DESC, o.created_at DESC
       LIMIT $${params.length}`,
      params
    );
    return result.rows.map((row) => new Opportunity(row));
  }

  static async countByAuthorId(authorId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM opportunities WHERE created_by = $1',
      [authorId]
    );
    return result.rows[0].count;
  }

  static async findByOwner(ownerId, { page = 1, limit = 20, status, includeInactive = true } = {}) {
    const params = [ownerId];
    const where = ['o.created_by = $1'];

    if (status === 'active') {
      where.push('o.is_active = TRUE');
      where.push("o.status = 'published'");
      where.push('o.deadline > NOW()');
    } else if (status === 'closed') {
      where.push('(o.is_active = FALSE OR o.deadline <= NOW() OR o.status != \'published\')');
    } else if (status === 'draft') {
      where.push("o.status = 'draft'");
    }

    if (!includeInactive && status !== 'closed') {
      // no extra filter
    }

    const whereSql = where.join(' AND ');
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM opportunities o WHERE ${whereSql}`,
      params
    );
    const total = countResult.rows[0].count;
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email,
              u.avatar AS creator_avatar, u.role AS creator_role,
              (SELECT COUNT(*)::int FROM opportunity_saved s WHERE s.opportunity_id = o.id) AS bookmark_count
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       WHERE ${whereSql}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      opportunities: result.rows.map((row) => {
        const opp = new Opportunity(row);
        opp.bookmarkCount = Number(row.bookmark_count) || 0;
        return opp;
      }),
      total,
      page,
      limit,
    };
  }

  static async getOwnerStats(ownerId) {
    const result = await db.query(
      `SELECT
         COUNT(*)::int AS total_opportunities,
         COUNT(*) FILTER (WHERE is_active = TRUE AND deadline > NOW() AND status = 'published')::int AS active_count,
         COUNT(*) FILTER (WHERE is_active = FALSE OR deadline <= NOW() OR status != 'published')::int AS closed_count,
         COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_count,
         COALESCE(SUM(view_count), 0)::int AS total_views,
         COALESCE(SUM(application_count), 0)::int AS total_applications
       FROM opportunities WHERE created_by = $1`,
      [ownerId]
    );
    const apps = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM opportunity_applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE o.created_by = $1 AND a.status = 'pending'`,
      [ownerId]
    );
    const row = result.rows[0] || {};
    return {
      totalOpportunities: row.total_opportunities || 0,
      activeCount: row.active_count || 0,
      closedCount: row.closed_count || 0,
      draftCount: row.draft_count || 0,
      totalViews: row.total_views || 0,
      totalApplications: row.total_applications || 0,
      pendingApplications: apps.rows[0]?.count || 0,
    };
  }

  static async getHubStats() {
    const [counts, trendingTitles, trendingSkills, byType] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE is_active = TRUE AND deadline > NOW() AND status = 'published')::int AS live_count,
          COALESCE(SUM(application_count), 0)::int AS total_applications,
          COALESCE(SUM(view_count), 0)::int AS total_views
        FROM opportunities
      `),
      db.query(`
        SELECT title FROM opportunities
        WHERE is_active = TRUE AND deadline > NOW() AND status = 'published'
        ORDER BY view_count DESC NULLS LAST, created_at DESC
        LIMIT 5
      `),
      db.query(`
        SELECT skill, COUNT(*)::int AS cnt
        FROM opportunities o, unnest(o.skills) AS skill
        WHERE o.is_active = TRUE AND o.deadline > NOW() AND o.status = 'published'
        GROUP BY skill ORDER BY cnt DESC, skill ASC LIMIT 6
      `),
      db.query(`
        SELECT type, COUNT(*)::int AS count FROM opportunities
        WHERE is_active = TRUE AND deadline > NOW() AND status = 'published'
        GROUP BY type ORDER BY count DESC
      `),
    ]);

    const row = counts.rows[0] || {};
    const trending = [
      ...trendingSkills.rows.map((r) => r.skill),
      ...trendingTitles.rows.map((r) => r.title),
    ].filter(Boolean).slice(0, 6);

    return {
      liveCount: row.live_count || 0,
      totalApplications: row.total_applications || 0,
      totalViews: row.total_views || 0,
      trending,
      byType: byType.rows.map((r) => ({ type: r.type, count: r.count })),
    };
  }

  async save() {
    const now = new Date();
    const cols = {
      title: this.title,
      description: this.description,
      type: this.type,
      location: this.location,
      email: this.contact?.email,
      phone: this.contact?.phone,
      website: this.contact?.website,
      company: this.company,
      deadline: this.deadline,
      work_mode: this.workMode || 'onsite',
      employment_type: this.employmentType,
      experience_level: this.experienceLevel,
      salary_min: this.salaryMin,
      salary_max: this.salaryMax,
      salary_currency: this.salaryCurrency || 'XAF',
      stipend: this.stipend,
      skills: this.skills || [],
      tags: this.tags || [],
      responsibilities: this.responsibilities,
      requirements: this.requirements,
      benefits: this.benefits,
      company_description: this.companyDescription,
      industry: this.industry,
      company_logo: this.companyLogo,
      is_verified: this.isVerified,
      is_featured: this.isFeatured,
      application_questions: JSON.stringify(this.applicationQuestions || []),
      required_documents: JSON.stringify(this.requiredDocuments || []),
      max_applicants: this.maxApplicants,
      application_process: this.applicationProcess,
      faq: JSON.stringify(this.faq || []),
      status: this.status || 'published',
      updated_at: now,
    };

    if (!this.id) {
      const result = await db.query(
        `INSERT INTO opportunities (
           title, description, type, location, email, phone, website, company, deadline,
           created_by, created_at, updated_at, work_mode, employment_type, experience_level,
           salary_min, salary_max, salary_currency, stipend, skills, tags, responsibilities,
           requirements, benefits, company_description, industry, company_logo, is_verified,
           is_featured, application_questions, required_documents, max_applicants,
           application_process, faq, status
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30::jsonb,$31::jsonb,$32,$33,$34::jsonb,$35
         ) RETURNING *`,
        [
          cols.title, cols.description, cols.type, cols.location, cols.email, cols.phone,
          cols.website, cols.company, cols.deadline, this.createdBy, now, now,
          cols.work_mode, cols.employment_type, cols.experience_level, cols.salary_min,
          cols.salary_max, cols.salary_currency, cols.stipend, cols.skills, cols.tags,
          cols.responsibilities, cols.requirements, cols.benefits, cols.company_description,
          cols.industry, cols.company_logo, cols.is_verified, cols.is_featured,
          cols.application_questions, cols.required_documents, cols.max_applicants,
          cols.application_process, cols.faq, cols.status,
        ]
      );
      Object.assign(this, new Opportunity(result.rows[0]));
    } else {
      const result = await db.query(
        `UPDATE opportunities SET
           title=$1, description=$2, type=$3, location=$4, email=$5, phone=$6, website=$7,
           company=$8, deadline=$9, is_active=$10, updated_at=$11, work_mode=$12,
           employment_type=$13, experience_level=$14, salary_min=$15, salary_max=$16,
           salary_currency=$17, stipend=$18, skills=$19, tags=$20, responsibilities=$21,
           requirements=$22, benefits=$23, company_description=$24, industry=$25,
           company_logo=$26, application_questions=$27::jsonb, required_documents=$28::jsonb,
           max_applicants=$29, application_process=$30, faq=$31::jsonb, status=$32
         WHERE id=$33 RETURNING *`,
        [
          cols.title, cols.description, cols.type, cols.location, cols.email, cols.phone,
          cols.website, cols.company, cols.deadline, this.isActive, now,
          cols.work_mode, cols.employment_type, cols.experience_level, cols.salary_min,
          cols.salary_max, cols.salary_currency, cols.stipend, cols.skills, cols.tags,
          cols.responsibilities, cols.requirements, cols.benefits, cols.company_description,
          cols.industry, cols.company_logo, cols.application_questions, cols.required_documents,
          cols.max_applicants, cols.application_process, cols.faq, cols.status, this.id,
        ]
      );
      Object.assign(this, new Opportunity(result.rows[0]));
    }
    return this;
  }

  toJSON() {
    const posterEmail = this.creator?.email || this.contact?.email || '';
    const isOpen =
      (this.isActive ?? true) &&
      this.status === 'published' &&
      (this.deadline ? new Date(this.deadline) > new Date() : false) &&
      (this.maxApplicants == null || this.applicationCount < this.maxApplicants);

    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      location: this.location,
      company: this.company,
      deadline: this.deadline,
      contactInfo: this.contact,
      contact: this.contact,
      workMode: this.workMode,
      employmentType: this.employmentType,
      experienceLevel: this.experienceLevel,
      salaryMin: this.salaryMin,
      salaryMax: this.salaryMax,
      salaryCurrency: this.salaryCurrency,
      stipend: this.stipend,
      skills: this.skills,
      tags: this.tags,
      responsibilities: this.responsibilities,
      requirements: this.requirements,
      benefits: this.benefits,
      companyDescription: this.companyDescription,
      industry: this.industry,
      companyLogo: this.companyLogo,
      isVerified: this.isVerified,
      isFeatured: this.isFeatured,
      viewCount: this.viewCount,
      applicationCount: this.applicationCount,
      bookmarkCount: this.bookmarkCount ?? undefined,
      applicationQuestions: this.applicationQuestions,
      requiredDocuments: this.requiredDocuments,
      maxApplicants: this.maxApplicants,
      applicationProcess: this.applicationProcess,
      faq: this.faq,
      status: this.status,
      isActive: this.isActive,
      isOpen,
      isSaved: this.isSaved,
      createdBy: this.createdBy,
      creator: this.creator,
      posterEmail,
      posterName: this.creator?.name || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Opportunity;
