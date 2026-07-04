const db = require('../db');
const Post = require('../models/Post');
const Opportunity = require('../models/Opportunity');
const Business = require('../models/Business');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

const ROLE_OPPORTUNITY_TYPES = {
  student: ['internship', 'scholarship', 'fellowship', 'training', 'workshop'],
  job_seeker: ['job', 'internship', 'training'],
  entrepreneur: ['grant', 'competition', 'hackathon', 'mentorship'],
  business: ['grant', 'workshop', 'conference', 'partnership'],
  ngo: ['volunteering', 'grant', 'fellowship', 'training'],
  admin: [],
};

function formatTrend(current, previous) {
  if (!previous && !current) return '—';
  if (!previous) return `+${current}`;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return '0%';
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function computeProfileCompletion(user) {
  const filled = [user.name, user.bio, user.location, user.avatar].filter(
    (v) => v && String(v).trim()
  ).length;
  return Math.min(100, filled * 25);
}

function activityLink(type) {
  const routes = {
    post: '/feed',
    opportunity: '/opportunities',
    business: '/businesses',
    event: '/events',
  };
  return routes[type] || '/dashboard';
}

function normalizeActivityRow(row) {
  const title = row.title || 'Untitled';
  return {
    id: row.id,
    title: title.length > 120 ? `${title.slice(0, 117)}...` : title,
    created_at: row.created_at,
    type: row.type,
    status: row.status || 'active',
    link: activityLink(row.type),
  };
}

async function getUserStatTrends(userId) {
  const result = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM posts
        WHERE author_id = $1 AND created_at >= NOW() - INTERVAL '7 days') AS posts_week,
      (SELECT COUNT(*)::int FROM posts
        WHERE author_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
          AND created_at < NOW() - INTERVAL '7 days') AS posts_prev,
      (SELECT COUNT(*)::int FROM opportunities
        WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '7 days') AS opps_week,
      (SELECT COUNT(*)::int FROM opportunities
        WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '14 days'
          AND created_at < NOW() - INTERVAL '7 days') AS opps_prev,
      (SELECT COUNT(*)::int FROM businesses
        WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '7 days') AS biz_week,
      (SELECT COUNT(*)::int FROM businesses
        WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '14 days'
          AND created_at < NOW() - INTERVAL '7 days') AS biz_prev,
      (SELECT COUNT(*)::int FROM events
        WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '7 days') AS events_week,
      (SELECT COUNT(*)::int FROM events
        WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '14 days'
          AND created_at < NOW() - INTERVAL '7 days') AS events_prev`,
    [userId]
  );

  const r = result.rows[0];
  return {
    post: formatTrend(r.posts_week, r.posts_prev),
    opportunity: formatTrend(r.opps_week, r.opps_prev),
    business: formatTrend(r.biz_week, r.biz_prev),
    event: formatTrend(r.events_week, r.events_prev),
  };
}

async function getRecentActivity(userId) {
  const [recentPosts, recentOpps, recentBus, recentEvents] = await Promise.all([
    db.query(
      `SELECT id,
              LEFT(content, 120) AS title,
              created_at,
              'post' AS type,
              'active' AS status
       FROM posts
       WHERE author_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
    db.query(
      `SELECT id, title, created_at, 'opportunity' AS type,
              CASE
                WHEN is_active AND deadline > NOW() THEN 'active'
                WHEN deadline <= NOW() THEN 'expired'
                ELSE 'inactive'
              END AS status
       FROM opportunities
       WHERE created_by = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
    db.query(
      `SELECT id, name AS title, created_at, 'business' AS type,
              CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status
       FROM businesses
       WHERE created_by = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
    db.query(
      `SELECT id, title, created_at, 'event' AS type,
              CASE
                WHEN is_active AND date >= CURRENT_DATE THEN 'active'
                WHEN date < CURRENT_DATE THEN 'past'
                ELSE 'inactive'
              END AS status
       FROM events
       WHERE created_by = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
  ]);

  return [...recentPosts.rows, ...recentOpps.rows, ...recentBus.rows, ...recentEvents.rows]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)
    .map(normalizeActivityRow);
}

async function getCommunityStats() {
  const result = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM users WHERE is_active = TRUE) AS active_users,
      (SELECT COUNT(*)::int FROM users
        WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS users_this_month,
      (SELECT COUNT(*)::int FROM users
        WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
          AND created_at < date_trunc('month', CURRENT_DATE)) AS users_last_month,
      (SELECT COUNT(*)::int FROM users
        WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_week,
      (SELECT COUNT(*)::int FROM events
        WHERE is_active = TRUE AND date >= CURRENT_DATE) AS upcoming_events_count`
  );

  const row = result.rows[0];
  const postsToday = await Post.countToday();

  return {
    activeUsers: row.active_users,
    postsToday,
    newUsersThisWeek: row.new_users_week,
    upcomingEventsCount: row.upcoming_events_count,
    growthRate: formatTrend(row.users_this_month, row.users_last_month),
  };
}

async function getEngagementChart() {
  const result = await db.query(
    `WITH days AS (
       SELECT generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         INTERVAL '1 day'
       )::date AS day
     )
     SELECT
       TO_CHAR(d.day, 'Dy') AS day,
       d.day AS sort_day,
       (
         COALESCE((SELECT COUNT(*)::int FROM posts WHERE created_at::date = d.day), 0) +
         COALESCE((SELECT COUNT(*)::int FROM opportunities WHERE created_at::date = d.day), 0) +
         COALESCE((SELECT COUNT(*)::int FROM businesses WHERE created_at::date = d.day), 0) +
         COALESCE((SELECT COUNT(*)::int FROM events WHERE created_at::date = d.day), 0) +
         COALESCE((SELECT COUNT(*)::int FROM post_likes WHERE created_at::date = d.day), 0) +
         COALESCE((SELECT COUNT(*)::int FROM post_comments WHERE created_at::date = d.day), 0)
       ) AS value
     FROM days d
     ORDER BY d.day ASC`
  );

  return result.rows.map((row) => ({
    day: row.day,
    value: row.value,
  }));
}

async function getRecommendations(user) {
  const roleTypes = ROLE_OPPORTUNITY_TYPES[user.role] || [];
  const location = user.location ? String(user.location).trim() : null;

  let result;
  if (roleTypes.length > 0 && location) {
    result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       WHERE o.is_active = TRUE
         AND o.deadline > NOW()
         AND o.type = ANY($1::text[])
       ORDER BY
         CASE WHEN o.location ILIKE $2 THEN 0 ELSE 1 END,
         o.created_at DESC
       LIMIT 3`,
      [roleTypes, `%${location}%`]
    );
  } else if (roleTypes.length > 0) {
    result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       WHERE o.is_active = TRUE
         AND o.deadline > NOW()
         AND o.type = ANY($1::text[])
       ORDER BY o.created_at DESC
       LIMIT 3`,
      [roleTypes]
    );
  } else if (location) {
    result = await db.query(
      `SELECT o.*, u.name AS creator_name, u.email AS creator_email
       FROM opportunities o
       JOIN users u ON u.id = o.created_by
       WHERE o.is_active = TRUE
         AND o.deadline > NOW()
       ORDER BY
         CASE WHEN o.location ILIKE $1 THEN 0 ELSE 1 END,
         o.created_at DESC
       LIMIT 3`,
      [`%${location}%`]
    );
  } else {
    const { opportunities } = await Opportunity.findActivePaginated({ page: 1, limit: 3 });
    return opportunities.map((o) => o.toJSON());
  }

  if (result.rows.length === 0) {
    const { opportunities } = await Opportunity.findActivePaginated({ page: 1, limit: 3 });
    return opportunities.map((o) => o.toJSON());
  }

  return result.rows.map((row) => new Opportunity(row).toJSON());
}

async function getDashboardData(user) {
  const userId = user.id;

  const [
    postCount,
    opportunityCount,
    businessCount,
    eventCount,
    trends,
    recentActivity,
    communityStats,
    upcomingEvents,
    engagement,
    recommendations,
    unreadNotifications,
  ] = await Promise.all([
    Post.countByAuthorId(userId),
    Opportunity.countByAuthorId(userId),
    Business.countByAuthorId(userId),
    Event.countByAuthorId(userId),
    getUserStatTrends(userId),
    getRecentActivity(userId),
    getCommunityStats(),
    Event.findUpcoming(3),
    getEngagementChart(),
    getRecommendations(user),
    Notification.countUnread(userId),
  ]);

  return {
    stats: [
      { label: 'Posts Created', value: postCount, type: 'post', trend: trends.post },
      { label: 'Opportunities Posted', value: opportunityCount, type: 'opportunity', trend: trends.opportunity },
      { label: 'Businesses Listed', value: businessCount, type: 'business', trend: trends.business },
      { label: 'Events Organized', value: eventCount, type: 'event', trend: trends.event },
    ],
    recentActivity,
    communityStats,
    engagement,
    recommendations,
    profileCompletion: computeProfileCompletion(user),
    unreadNotifications,
    upcomingEvents: upcomingEvents.map((e) => e.toJSON()),
  };
}

module.exports = {
  getDashboardData,
  computeProfileCompletion,
};
