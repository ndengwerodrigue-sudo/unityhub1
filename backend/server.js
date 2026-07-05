const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const { query } = require('./db');
const { createGlobalLimiter } = require('./utils/rateLimiters');
const { createCorsOptions, getAllowedOrigins } = require('./utils/corsConfig');
const { getGoogleCallbackUrl, getGithubCallbackUrl } = require('./utils/oauthUrls');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const opportunityRoutes = require('./routes/opportunities');
const businessRoutes = require('./routes/businesses');
const eventRoutes = require('./routes/events');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const conversationRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');

const app = express();

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_REQUESTS === 'true') {
    console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  }
  next();
});

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS must run before rate limiting so preflight always gets headers
const corsOptions = createCorsOptions();
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(createGlobalLimiter());
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Uploaded post media (videos, audio files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection (PostgreSQL) + light migrations
const runMigrations = async () => {
  try {
    await query('ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_type_check');
    await query('ALTER TABLE opportunities ALTER COLUMN type TYPE VARCHAR(50)');
  } catch (err) {
    console.warn('Opportunity type migration:', err.message);
  }
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS post_favorites (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS post_reposts (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        repost_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )`);
    console.log('Post engagement tables ready');
  } catch (err) {
    console.warn('Post engagement tables migration:', err.message);
  }
  try {
    await query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_of_id UUID REFERENCES posts(id) ON DELETE SET NULL');
  } catch (err) {
    console.warn('posts.repost_of_id column (optional):', err.message);
  }
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS opportunity_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        applicant_name VARCHAR(255) NOT NULL,
        applicant_email VARCHAR(255) NOT NULL,
        phone VARCHAR(80),
        message TEXT NOT NULL,
        portfolio_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'submitted',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (opportunity_id, applicant_id)
      )`);
    console.log('Opportunity applications table ready');
  } catch (err) {
    console.warn('Opportunity applications migration:', err.message);
  }
  try {
    const { runNotificationsMigration } = require('./scripts/run-notifications-migration');
    await runNotificationsMigration();
  } catch (err) {
    console.warn('Notifications migration:', err.message);
  }
  try {
    const { runPostMediaMigration } = require('./scripts/run-post-media-migration');
    await runPostMediaMigration();
  } catch (err) {
    console.warn('Post media migration:', err.message);
  }
  try {
    const { runCommentEngagementMigration } = require('./scripts/run-comment-engagement-migration');
    await runCommentEngagementMigration();
    console.log('Comment replies & likes tables ready');
  } catch (err) {
    console.warn('Comment engagement migration:', err.message);
  }
  try {
    const { runOpportunitiesV2Migration } = require('./scripts/run-opportunities-v2-migration');
    await runOpportunitiesV2Migration();
    console.log('Opportunities v2 schema ready');
  } catch (err) {
    console.warn('Opportunities v2 migration:', err.message);
  }
  try {
    // Drop old simple table, create new full-featured schema
    await query('DROP TABLE IF EXISTS opportunity_messages CASCADE');
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        subject VARCHAR(500) NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'participant',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_read_at TIMESTAMPTZ,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_at TIMESTAMPTZ,
        UNIQUE(conversation_id, user_id)
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_body TEXT NOT NULL,
        message_type VARCHAR(20) NOT NULL DEFAULT 'internal',
        delivery_status VARCHAR(20) NOT NULL DEFAULT 'sent',
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        file_name VARCHAR(500) NOT NULL,
        file_path TEXT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        recipient_email VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255),
        subject TEXT NOT NULL,
        body_html TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        recipient_phone VARCHAR(50) NOT NULL,
        message_body TEXT NOT NULL,
        wa_link TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'generated',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_timeline (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    // Add conversation_id column to opportunity_applications
    await query('ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL');
    await query('CREATE INDEX IF NOT EXISTS idx_conv_opp ON conversations(opportunity_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_conv_participant_user ON conversation_participants(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_conv_participant_conv ON conversation_participants(conversation_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_msg_receiver ON messages(receiver_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_msg_delivery ON messages(delivery_status)');
    await query('CREATE INDEX IF NOT EXISTS idx_attach_msg ON message_attachments(message_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_email_status ON email_logs(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_timeline_conv ON conversation_timeline(conversation_id)');
    console.log('Conversations & messaging schema ready');
  } catch (err) {
    console.warn('Conversations & messaging migration:', err.message);
  }
  try {
    const { ensureContactTable } = require('./services/userContactService');
    await ensureContactTable();
    console.log('User contact preferences table ready');
  } catch (err) {
    console.warn('User contact preferences migration:', err.message);
  }
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE');
    console.log('Users phone/whatsapp columns ready');
  } catch (err) {
    console.warn('Users phone columns (optional):', err.message);
  }
  try {
    await query('ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ');
    await query('ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE');
    await query('ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ');
  } catch (err) {
    console.warn('Conversation participants columns (optional):', err.message);
  }
  try {
    const { runAuthMigration } = require('./scripts/run-auth-migration');
    await runAuthMigration();
    console.log('Auth schema ready');
  } catch (err) {
    console.warn('Auth migration:', err.message);
  }
  try {
    const { runOwnershipMigration } = require('./scripts/run-ownership-migration');
    await runOwnershipMigration();
    console.log('Ownership schema ready');
  } catch (err) {
    console.warn('Ownership migration:', err.message);
  }
};

query('SELECT 1')
  .then(async () => {
    console.log('PostgreSQL connected successfully');
    const { bootstrapSchema } = require('./scripts/bootstrap-schema');
    await bootstrapSchema();
    await runMigrations();
  })
  .catch(err => console.error('PostgreSQL connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Unity Hub API is running' });
});

app.get('/api/health/email', async (req, res) => {
  try {
    const { verifyEmailConfig } = require('./services/emailService');
    const status = await verifyEmailConfig();
    res.status(status.configured && (status.brevoApiOk || status.smtpOk) ? 200 : 503).json(status);
  } catch (error) {
    res.status(500).json({ configured: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS allowed origins:', getAllowedOrigins().join(', ') || '(none — set FRONTEND_URL on Railway)');
  console.log('Google OAuth callback:', getGoogleCallbackUrl());
  console.log('GitHub OAuth callback:', getGithubCallbackUrl());
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL && !process.env.FRONTEND_URLS) {
    console.warn('[CORS] Set FRONTEND_URL=https://unityhub1.vercel.app on Railway');
  }
  try {
    const { verifyEmailConfig, isConfigured } = require('./services/emailService');
    if (isConfigured()) {
      const emailStatus = await verifyEmailConfig();
      if (emailStatus.brevoApiOk || emailStatus.smtpOk) {
        console.log(`Email ready via ${emailStatus.brevoApiOk ? 'Brevo API' : 'SMTP'} (from: ${emailStatus.fromEmail})`);
      } else {
        console.warn('[Email] Configuration issue:', emailStatus.error);
        console.warn('[Email] Fix Brevo: verify FROM_EMAIL sender, regenerate API key, authorize server IP at https://app.brevo.com/security/authorised_ips');
      }
    } else {
      console.warn('[Email] Not configured — set BREVO_API_KEY in .env');
    }
  } catch (err) {
    console.warn('[Email] Startup check failed:', err.message);
  }
});
