const jwt = require('jsonwebtoken');

const crypto = require('crypto');

const speakeasy = require('speakeasy');

const { promisify } = require('util');

const bcrypt = require('bcrypt');

// Initialize Redis client for session management
const redisClient = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Enhanced JWT configuration with rotating secrets
class JWTManager {
  constructor() {
    this.algorithm = 'HS512';
    this.issuer = 'dreamerai.io';
    this.audience = 'dreamerai-api';
    this.accessTokenExpiry = '15m'; // Reduced from 1h
    this.refreshTokenExpiry = '7d';
    this.secretRotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize secrets
    this.currentSecret = this.generateSecret();
    this.previousSecret = null;
    this.secretRotationTime = Date.now();
    
    // Start secret rotation timer
    this.startSecretRotation();
  }

  generateSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  startSecretRotation() {
    setInterval(() => {
      this.previousSecret = this.currentSecret;
      this.currentSecret = this.generateSecret();
      this.secretRotationTime = Date.now();
      console.log('JWT secret rotated successfully');
    }, this.secretRotationInterval);
  }

  async generateTokens(userId, role = 'user', deviceId = null) {
    const jti = crypto.randomBytes(16).toString('hex');
    const payload = {
      userId,
      role,
      deviceId,
      jti,
      iss: this.issuer,
      aud: this.audience
    };

    const accessToken = jwt.sign(payload, this.currentSecret, {
      expiresIn: this.accessTokenExpiry,
      algorithm: this.algorithm
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.currentSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        algorithm: this.algorithm
      }
    );

    // Store refresh token in Redis with device tracking
    const refreshKey = `refresh:${userId}:${jti}`;
    await redisClient.setex(
      refreshKey,
      7 * 24 * 60 * 60, // 7 days in seconds
      JSON.stringify({
        userId,
        role,
        deviceId,
        createdAt: Date.now()
      })
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      refreshExpiresIn: 604800 // 7 days in seconds
    };
  }

  async verifyToken(token) {
    try {
      // Try current secret first
      try {
        return await promisify(jwt.verify)(token, this.currentSecret, {
          issuer: this.issuer,
          audience: this.audience,
          algorithms: [this.algorithm]
        });
      } catch (error) {
        // If current secret fails and we have a previous secret, try it
        if (this.previousSecret && error.name === 'JsonWebTokenError') {
          return await promisify(jwt.verify)(token, this.previousSecret, {
            issuer: this.issuer,
            audience: this.audience,
            algorithms: [this.algorithm]
          });
        }
        throw error;
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  async revokeToken(token) {
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti) {
      const blacklistKey = `blacklist:${decoded.jti}`;
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redisClient.setex(blacklistKey, ttl, '1');
      }
    }
  }

  async isTokenBlacklisted(jti) {
    const result = await redisClient.get(`blacklist:${jti}`);
    return result === '1';
  }
}

// Initialize JWT Manager
const jwtManager = new JWTManager();

/**
 * Enhanced password security with entropy checking
 */
class PasswordManager {
  constructor() {
    this.minLength = 12;
    this.maxLength = 128;
    this.saltRounds = 14; // Increased from 12
    this.commonPasswords = new Set(); // Load from file in production
    this.loadCommonPasswords();
  }

  async loadCommonPasswords() {
    // In production, load from a file containing top 10000 common passwords
    this.commonPasswords = new Set([
      'password123', 'admin123', 'qwerty123', 'letmein123',
      'welcome123', 'password1', 'admin1234', '12345678'
    ]);
  }

  calculateEntropy(password) {
    const charsets = {
      lowercase: /[a-z]/.test(password) ? 26 : 0,
      uppercase: /[A-Z]/.test(password) ? 26 : 0,
      numbers: /\d/.test(password) ? 10 : 0,
      special: /[^\dA-Za-z]/.test(password) ? 32 : 0
    };

    const possibleChars = Object.values(charsets).reduce((a, b) => a + b, 0);
    return password.length * Math.log2(possibleChars);
  }

  validatePassword(password) {
    const errors = [];

    // Length check
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters`);
    }
    if (password.length > this.maxLength) {
      errors.push(`Password must not exceed ${this.maxLength} characters`);
    }

    // Complexity requirements
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!"#$%&()*,.:<>?@^{|}]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Sequential character check
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }

    // Common patterns check
    const commonPatterns = ['123', 'abc', 'qwe', 'asd'];
    for (const pattern of commonPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errors.push('Password contains common patterns');
        break;
      }
    }

    // Common password check
    if (this.commonPasswords.has(password.toLowerCase())) {
      errors.push('This password is too common');
    }

    // Entropy check
    const entropy = this.calculateEntropy(password);
    if (entropy < 50) {
      errors.push('Password is not strong enough');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.getPasswordStrength(entropy)
    };
  }

  getPasswordStrength(entropy) {
    if (entropy < 30) return 'very weak';
    if (entropy < 50) return 'weak';
    if (entropy < 70) return 'moderate';
    if (entropy < 90) return 'strong';
    return 'very strong';
  }

  async hashPassword(password) {
    // Add pepper for additional security
    const pepper = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
    const pepperedPassword = password + pepper;
    return bcrypt.hash(pepperedPassword, this.saltRounds);
  }

  async verifyPassword(password, hash) {
    const pepper = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
    const pepperedPassword = password + pepper;
    return bcrypt.compare(pepperedPassword, hash);
  }

  generateSecurePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}

// Initialize Password Manager
const passwordManager = new PasswordManager();

/**
 * Multi-Factor Authentication Manager
 */
class MFAManager {
  constructor() {
    this.appName = 'Dreamer AI Solutions';
    this.backupCodeCount = 10;
    this.otpWindow = 2; // Allow 2 time steps before/after
  }

  generateSecret(userId) {
    const secret = speakeasy.generateSecret({
      name: `${this.appName} (${userId})`,
      issuer: this.appName,
      length: 32
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }

  async generateQRCode(otpauthUrl) {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: this.otpWindow
    });
  }

  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  async hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  async verifyBackupCode(code, hashedCodes) {
    const hashedInput = await this.hashBackupCode(code);
    return hashedCodes.includes(hashedInput);
  }
}

// Initialize MFA Manager
const mfaManager = new MFAManager();

/**
 * Session Manager for device tracking and concurrent session control
 */
class SessionManager {
  constructor() {
    this.maxConcurrentSessions = 5;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async createSession(userId, deviceInfo) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId,
      sessionId,
      deviceInfo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent
    };

    // Store session
    const sessionKey = `session:${userId}:${sessionId}`;
    await redisClient.setex(
      sessionKey,
      this.sessionTimeout / 1000,
      JSON.stringify(sessionData)
    );

    // Add to user's session list
    await redisClient.sadd(`user:sessions:${userId}`, sessionId);

    // Check concurrent session limit
    await this.enforceSessionLimit(userId);

    return sessionId;
  }

  async enforceSessionLimit(userId) {
    const sessions = await redisClient.smembers(`user:sessions:${userId}`);
    
    if (sessions.length > this.maxConcurrentSessions) {
      // Get all session data to find oldest
      const sessionData = await Promise.all(
        sessions.map(async (sessionId) => {
          const data = await redisClient.get(`session:${userId}:${sessionId}`);
          return data ? { sessionId, ...JSON.parse(data) } : null;
        })
      );

      // Sort by creation time and remove oldest sessions
      const validSessions = sessionData.filter(s => s !== null);
      validSessions.sort((a, b) => a.createdAt - b.createdAt);

      const sessionsToRemove = validSessions.slice(0, validSessions.length - this.maxConcurrentSessions);
      
      for (const session of sessionsToRemove) {
        await this.terminateSession(userId, session.sessionId);
      }
    }
  }

  async validateSession(userId, sessionId) {
    const sessionKey = `session:${userId}:${sessionId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    
    // Update last activity
    session.lastActivity = Date.now();
    await redisClient.setex(
      sessionKey,
      this.sessionTimeout / 1000,
      JSON.stringify(session)
    );

    return true;
  }

  async terminateSession(userId, sessionId) {
    await redisClient.del(`session:${userId}:${sessionId}`);
    await redisClient.srem(`user:sessions:${userId}`, sessionId);
  }

  async terminateAllSessions(userId) {
    const sessions = await redisClient.smembers(`user:sessions:${userId}`);
    
    for (const sessionId of sessions) {
      await redisClient.del(`session:${userId}:${sessionId}`);
    }
    
    await redisClient.del(`user:sessions:${userId}`);
  }

  async getActiveSessions(userId) {
    const sessions = await redisClient.smembers(`user:sessions:${userId}`);
    const sessionData = await Promise.all(
      sessions.map(async (sessionId) => {
        const data = await redisClient.get(`session:${userId}:${sessionId}`);
        return data ? JSON.parse(data) : null;
      })
    );

    return sessionData.filter(s => s !== null);
  }
}

// Initialize Session Manager
const sessionManager = new SessionManager();

/**
 * Account Security Features
 */
class AccountSecurity {
  constructor() {
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
    this.passwordHistoryLimit = 5;
  }

  async recordLoginAttempt(identifier, success) {
    const key = `login:attempts:${identifier}`;
    
    if (success) {
      await redisClient.del(key);
      return;
    }

    const attempts = await redisClient.incr(key);
    await redisClient.expire(key, this.lockoutDuration / 1000);

    if (attempts >= this.maxLoginAttempts) {
      await this.lockAccount(identifier);
    }

    return attempts;
  }

  async isAccountLocked(identifier) {
    const lockKey = `account:locked:${identifier}`;
    const locked = await redisClient.get(lockKey);
    return locked === '1';
  }

  async lockAccount(identifier) {
    const lockKey = `account:locked:${identifier}`;
    await redisClient.setex(lockKey, this.lockoutDuration / 1000, '1');
    
    // Log security event
    console.log(`Account locked due to failed login attempts: ${identifier}`);
  }

  async unlockAccount(identifier) {
    await redisClient.del(`account:locked:${identifier}`);
    await redisClient.del(`login:attempts:${identifier}`);
  }

  async checkPasswordHistory(userId, passwordHash) {
    const historyKey = `password:history:${userId}`;
    const history = await redisClient.lrange(historyKey, 0, -1);
    
    for (const oldHash of history) {
      if (oldHash === passwordHash) {
        return false; // Password was used before
      }
    }
    
    return true; // Password is new
  }

  async addPasswordToHistory(userId, passwordHash) {
    const historyKey = `password:history:${userId}`;
    await redisClient.lpush(historyKey, passwordHash);
    await redisClient.ltrim(historyKey, 0, this.passwordHistoryLimit - 1);
  }
}

// Initialize Account Security
const accountSecurity = new AccountSecurity();

/**
 * Enhanced authentication middleware
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
    const decoded = await jwtManager.verifyToken(token);

    // Check if token is blacklisted
    if (decoded.jti && await jwtManager.isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/token-revoked',
        title: 'Token Revoked',
        status: 401,
        detail: 'This token has been revoked',
        instance: req.originalUrl
      });
    }

    // Validate session if sessionId is present
    if (req.headers['x-session-id']) {
      const sessionValid = await sessionManager.validateSession(
        decoded.userId,
        req.headers['x-session-id']
      );
      
      if (!sessionValid) {
        return res.status(401).json({
          type: 'https://api.dreamerai.io/errors/invalid-session',
          title: 'Invalid Session',
          status: 401,
          detail: 'Session has expired or is invalid',
          instance: req.originalUrl
        });
      }
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      jti: decoded.jti
    };

    // Add security context
    req.securityContext = {
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp,
      deviceId: decoded.deviceId
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
 * MFA verification middleware
 */
const requireMFA = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/authentication-required',
        title: 'Authentication Required',
        status: 401,
        detail: 'User must be authenticated',
        instance: req.originalUrl
      });
    }

    const mfaToken = req.headers['x-mfa-token'];
    if (!mfaToken) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/mfa-required',
        title: 'MFA Required',
        status: 401,
        detail: 'Multi-factor authentication token required',
        instance: req.originalUrl
      });
    }

    // Verify MFA token (implement based on user's MFA settings)
    // This is a placeholder - implement actual MFA verification
    const mfaValid = true; // await verifyUserMFA(req.user.id, mfaToken);
    
    if (!mfaValid) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/invalid-mfa',
        title: 'Invalid MFA Token',
        status: 401,
        detail: 'The provided MFA token is invalid',
        instance: req.originalUrl
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      type: 'https://api.dreamerai.io/errors/mfa-error',
      title: 'MFA Verification Error',
      status: 500,
      detail: error.message,
      instance: req.originalUrl
    });
  }
};

/**
 * Device trust middleware
 */
const deviceTrust = async (req, res, next) => {
  const deviceId = req.headers['x-device-id'];
  const deviceFingerprint = req.headers['x-device-fingerprint'];
  
  if (!deviceId || !deviceFingerprint) {
    req.deviceTrusted = false;
    return next();
  }

  // Verify device fingerprint
  const trustedDevice = await redisClient.get(`device:trusted:${req.user.id}:${deviceId}`);
  
  if (trustedDevice) {
    const savedFingerprint = JSON.parse(trustedDevice).fingerprint;
    req.deviceTrusted = savedFingerprint === deviceFingerprint;
  } else {
    req.deviceTrusted = false;
  }

  next();
};

/**
 * Rate limiting for auth endpoints with progressive delays
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use IP + user identifier for more accurate rate limiting
    return `${req.ip}:${req.body.email || req.body.username || 'anonymous'}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      type: 'https://api.dreamerai.io/errors/rate-limit',
      title: 'Too Many Authentication Attempts',
      status: 429,
      detail: 'Too many authentication attempts. Please try again later.',
      retryAfter: 900
    });
  },
  skip: (req) => {
    // Skip rate limiting for trusted devices
    return req.deviceTrusted === true;
  }
});
const redis = require('ioredis');
const QRCode = require('qrcode');

module.exports = {
  jwtManager,
  passwordManager,
  mfaManager,
  sessionManager,
  accountSecurity,
  authenticate,
  requireMFA,
  deviceTrust,
  authRateLimit,
  // Export legacy functions for backward compatibility
  generateTokens: (userId, role) => jwtManager.generateTokens(userId, role),
  verifyToken: (token) => jwtManager.verifyToken(token),
  hashPassword: (password) => passwordManager.hashPassword(password),
  verifyPassword: (password, hash) => passwordManager.verifyPassword(password, hash),
  validatePassword: (password) => passwordManager.validatePassword(password)
};