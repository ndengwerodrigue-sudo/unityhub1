const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const {
  createAuthLimiter,
  createLoginLimiter,
  createRefreshLimiter,
  createOAuthExchangeLimiter,
} = require('../utils/rateLimiters');
const {
  issueAuthResponse,
  refreshAccessToken,
  revokeSession,
  revokeAllSessions,
  createOAuthCode,
  exchangeOAuthCode,
} = require('../utils/authTokens');
const { getOAuthServerBase } = require('../utils/oauthUrls');
const { setupOAuthRoutes } = require('./authOAuth');

const router = express.Router();

const sessionSecret = () => process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev_session_secret';

const authLimiter = createAuthLimiter();
const loginLimiter = createLoginLimiter();
const refreshLimiter = createRefreshLimiter();
const oauthExchangeLimiter = createOAuthExchangeLimiter();

router.use(['/login', '/register'], authLimiter);
router.use('/login', loginLimiter);
router.use('/refresh', refreshLimiter);
router.use('/oauth/exchange', oauthExchangeLimiter);

const getFrontendBase = () =>
  (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)[0]
    .replace(/\/+$/, '');

const getOAuthBase = () => getOAuthServerBase();

const safeNotify = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (err) {
    console.warn('Notification skipped:', err.message);
  }
};

const setRefreshCookie = (res, refreshToken, rememberMe = false) => {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 14 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/api/auth',
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

const sendAuthSuccess = async (res, user, options = {}) => {
  const { accessToken, refreshToken } = await issueAuthResponse(user.id, {
    rememberMe: options.rememberMe,
    userAgent: options.userAgent,
    ip: options.ip,
  });

  setRefreshCookie(res, refreshToken, options.rememberMe);
  await User.updateLastLogin(user.id);
  const freshUser = await User.findById(user.id);

  return res.json({
    message: options.message || 'Authentication successful',
    token: accessToken,
    accessToken,
    user: freshUser.toProfileJSON(),
  });
};

const createLinkToken = (userId, provider) =>
  jwt.sign({ userId, provider, purpose: 'oauth-link' }, sessionSecret(), { expiresIn: '10m' });

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['student', 'entrepreneur', 'business', 'ngo', 'job_seeker']).withMessage('Invalid role'),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, role, location } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email already exists. Try signing in or use Google/GitHub.',
      });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      location,
      avatar: '',
      bio: '',
      isActive: true,
    });

    await user.save();

    await safeNotify({
      userId: user.id,
      type: 'success',
      title: 'Welcome to Unity Hub!',
      message: `Hi ${user.name}, we're excited to have you join our community!`,
      link: '/dashboard',
    });

    return sendAuthSuccess(res, user, {
      message: 'User registered successfully',
      rememberMe: !!req.body.rememberMe,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await safeNotify({
      userId: user.id,
      type: 'info',
      title: 'Welcome Back!',
      message: 'You have successfully logged into your account.',
      link: '/feed',
    });

    return sendAuthSuccess(res, user, {
      message: 'Login successful',
      rememberMe: !!rememberMe,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const result = await refreshAccessToken(refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    if (!result) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    setRefreshCookie(res, result.refreshToken, false);
    const user = await User.findById(result.userId);
    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Account not found or deactivated.' });
    }

    res.json({
      message: 'Session refreshed',
      token: result.accessToken,
      accessToken: result.accessToken,
      user: user.toProfileJSON(),
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Could not refresh session' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await revokeSession(refreshToken);
    }
    clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

router.post('/logout-all', protect, async (req, res) => {
  try {
    await revokeAllSessions(req.user.id);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Could not log out from all devices' });
  }
});

router.post('/oauth/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code' });
    }

    const userId = await exchangeOAuthCode(code);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired sign-in code. Please try again.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account not found or deactivated' });
    }

    return sendAuthSuccess(res, user, {
      message: 'OAuth login successful',
      rememberMe: true,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({ message: 'Could not complete sign-in' });
  }
});

router.get('/providers/status', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  const hasPassword = await User.hasPassword(req.user.id);
  res.json({
    connectedProviders: user.oauthProviders,
    hasPassword,
    oauthConfigured: {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  });
});

router.post('/providers/:provider/connect', protect, async (req, res) => {
  const provider = req.params.provider;
  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({ message: 'Unsupported provider' });
  }

  const configured =
    provider === 'google'
      ? process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      : process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

  if (!configured) {
    return res.status(501).json({ message: `${provider} OAuth is not configured on the server` });
  }

  const linkToken = createLinkToken(req.user.id, provider);
  const url = `${getOAuthBase()}/api/auth/${provider}?link=${encodeURIComponent(linkToken)}`;
  res.json({ url });
});

router.delete('/providers/:provider', protect, async (req, res) => {
  const provider = req.params.provider;
  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({ message: 'Unsupported provider' });
  }

  const user = await User.findById(req.user.id);
  const hasPassword = await User.hasPassword(req.user.id);
  const connected = user.oauthProviders.map((p) => p.provider);
  const others = connected.filter((p) => p !== provider);

  if (!hasPassword && others.length === 0) {
    return res.status(400).json({
      message: 'Cannot disconnect your only sign-in method. Set a password first or connect another provider.',
    });
  }

  await User.unlinkOAuthProvider(req.user.id, provider);
  const updated = await User.findById(req.user.id);
  res.json({
    message: `${provider} disconnected`,
    user: updated.toProfileJSON(),
  });
});

router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      message: 'User profile retrieved successfully',
      user: req.user.toProfileJSON(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

router.put('/me', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 50 }).withMessage('Phone cannot exceed 50 characters'),
  body('whatsappOptIn').optional().isBoolean().withMessage('WhatsApp opt-in must be true or false'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, bio, location, avatar, phone, whatsappOptIn } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    if (phone !== undefined || whatsappOptIn !== undefined) {
      const { setContact } = require('../services/userContactService');
      const contact = await setContact(user.id, {
        phone: phone !== undefined ? phone : user.phone,
        whatsappOptIn: whatsappOptIn !== undefined ? whatsappOptIn : user.whatsappOptIn,
      });
      user.phone = contact.phone;
      user.whatsappOptIn = contact.whatsappOptIn;
    }

    res.json({
      message: 'Profile updated successfully',
      user: user.toProfileJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

setupOAuthRoutes(router, { getFrontendBase, createOAuthCode, sessionSecret });

module.exports = router;
