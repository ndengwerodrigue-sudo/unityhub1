const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const extractBearerToken = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;

  let token = auth.slice(7).trim();
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
};

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      console.warn('Auth failed: No token provided in headers');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const userId = decoded.id || decoded._id || decoded.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Invalid token. Please log in again.' });
      }

      const user = await User.findById(userId);

      if (!user) {
        console.warn(`Auth failed: User ${userId} not found`);
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }

      if (!user.isActive) {
        console.warn(`Auth failed: User ${user.id} is inactive`);
        return res.status(401).json({ message: 'Account has been deactivated.' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.warn('Auth failed: JWT verification error', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication.' });
  }
};

// Admin middleware - require admin role
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Optional middleware - check if user is authenticated but don't require it
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        const userId = decoded.id || decoded._id || decoded.userId;
        const user = userId ? await User.findById(userId) : null;
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without user
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = { protect, admin, optionalAuth };
