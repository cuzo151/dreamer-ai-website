const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const { promisify } = require('util');

const bcrypt = require('bcrypt');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_ISSUER = 'dreamerai.io';
const JWT_AUDIENCE = 'dreamerai-api';

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Generate JWT tokens
 */
const generateTokens = (userId, role = 'visitor') => {
  const payload = {
    userId,
    role,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      algorithm: 'HS256'
    }
  );

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 3600, // 1 hour in seconds
    refreshExpiresIn: 604800 // 7 days in seconds
  };
};

/**
 * Verify JWT token
 */
const verifyToken = async (token) => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = await promisify(jwt.verify)(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/authentication-required',
        title: 'Authentication Required',
        status: 401,
        detail: 'No valid authentication token provided',
        instance: req.originalUrl
      });
    }

    const token = authHeader.slice(7);
    const decoded = await verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };

    // Add request context for RLS
    req.dbContext = {
      'app.current_user_id': decoded.userId,
      'app.current_user_role': decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      type: 'https://api.dreamerai.io/errors/authentication-failed',
      title: 'Authentication Failed',
      status: 401,
      detail: error.message,
      instance: req.originalUrl
    });
  }
};

/**
 * Authorization middleware - check user roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/authentication-required',
        title: 'Authentication Required',
        status: 401,
        detail: 'User must be authenticated to access this resource',
        instance: req.originalUrl
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        type: 'https://api.dreamerai.io/errors/insufficient-permissions',
        title: 'Insufficient Permissions',
        status: 403,
        detail: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        instance: req.originalUrl
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = await verifyToken(token);
      req.user = {
        id: decoded.userId,
        role: decoded.role
      };
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify password
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate secure random token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Blacklist a token (logout)
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // In production, store in Redis with TTL
};

/**
 * Rate limiting for auth endpoints
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    type: 'https://api.dreamerai.io/errors/rate-limit',
    title: 'Too Many Authentication Attempts',
    status: 429,
    detail: 'Too many authentication attempts. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Password strength validator
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!"#$%&()*,.:<>?@^{|}]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate OTP for 2FA
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * API Key authentication for service-to-service
 */
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      type: 'https://api.dreamerai.io/errors/api-key-required',
      title: 'API Key Required',
      status: 401,
      detail: 'X-API-Key header is required for this endpoint',
      instance: req.originalUrl
    });
  }

  // In production, validate against database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      type: 'https://api.dreamerai.io/errors/invalid-api-key',
      title: 'Invalid API Key',
      status: 401,
      detail: 'The provided API key is invalid',
      instance: req.originalUrl
    });
  }

  next();
};

module.exports = {
  generateTokens,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  blacklistToken,
  authRateLimit,
  validatePassword,
  generateOTP,
  apiKeyAuth
};