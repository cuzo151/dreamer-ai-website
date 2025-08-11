const crypto = require('crypto');

const csrf = require('csurf');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');
const redis = require('ioredis');
const DOMPurify = require('isomorphic-dompurify');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const xss = require('xss-clean');

// Initialize Redis client
const redisClient = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

/**
 * Comprehensive security headers configuration
 */
const securityHeaders = () => {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'nonce-{NONCE}'", // Will be replaced dynamically
          "https://apis.google.com",
          "https://www.google-analytics.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Consider replacing with nonces
          "https://fonts.googleapis.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://api.dreamerai.io",
          "wss://api.dreamerai.io",
          "https://*.google-analytics.com"
        ],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
        blockAllMixedContent: [],
        baseUri: ["'self'"],
        reportUri: "/api/v1/security/csp-report"
      },
      reportOnly: false
    },
    
    // Strict Transport Security
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    
    // Additional security headers
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  });
};

/**
 * CSP Nonce middleware for inline scripts
 */
const cspNonce = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
};

/**
 * CSRF Protection Configuration
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  },
  value: (req) => {
    // Support multiple ways of sending CSRF token
    return req.body._csrf || 
           req.query._csrf || 
           req.headers['x-csrf-token'] ||
           req.headers['x-xsrf-token'];
  }
});

/**
 * Advanced XSS Protection
 */
const xssProtection = () => {
  return (req, res, next) => {
    // Clean body
    if (req.body) {
      req.body = cleanObject(req.body);
    }
    
    // Clean query parameters
    if (req.query) {
      req.query = cleanObject(req.query);
    }
    
    // Clean params
    if (req.params) {
      req.params = cleanObject(req.params);
    }
    
    next();
  };
};

function cleanObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return cleanValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }
  
  const cleaned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Clean the key itself
      const cleanKey = cleanValue(key);
      cleaned[cleanKey] = cleanObject(obj[key]);
    }
  }
  
  return cleaned;
}

function cleanValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Remove null bytes
  value = value.replaceAll('\0', '');
  
  // Basic XSS cleaning
  value = value
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#x27;')
    .replaceAll('/', '&#x2F;');
  
  // Use DOMPurify for HTML content
  if (value.includes('<') || value.includes('>')) {
    value = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }
  
  return value;
}

/**
 * SQL Injection Prevention
 */
const sqlInjectionProtection = () => {
  return (req, res, next) => {
    const suspicious = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/gi,
      /(-{2}|\/\*|\*\/|;|\||\\)/g,
      /(xp_|sp_|exec|execute|dbms_|utl_|pragma)/gi
    ];
    
    const checkValue = (value) => {
      if (typeof value !== 'string') return false;
      
      for (const pattern of suspicious) {
        if (pattern.test(value)) {
          return true;
        }
      }
      return false;
    };
    
    const checkObject = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (checkValue(key) || checkValue(obj[key])) {
            return true;
          }
          if (typeof obj[key] === 'object' && checkObject(obj[key])) {
              return true;
            }
        }
      }
      return false;
    };
    
    // Check all input sources
    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/invalid-input',
        title: 'Invalid Input Detected',
        status: 400,
        detail: 'The request contains potentially malicious input',
        instance: req.originalUrl
      });
    }
    
    next();
  };
};

/**
 * NoSQL Injection Prevention
 */
const noSQLInjectionProtection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL injection attempt detected and sanitized: ${key}`);
  }
});

/**
 * HTTP Parameter Pollution Prevention
 */
const parameterPollutionProtection = hpp({
  whitelist: ['sort', 'filter', 'page', 'limit'] // Allow specific params to have arrays
});

/**
 * Advanced Rate Limiting
 */
class RateLimiter {
  constructor() {
    // Different rate limiters for different operations
    this.limiters = {
      // General API rate limit
      api: new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:api',
        points: 100, // requests
        duration: 60, // per minute
        blockDuration: 60 * 5 // block for 5 minutes
      }),
      
      // Strict limit for authentication
      auth: new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:auth',
        points: 5,
        duration: 60 * 15, // 15 minutes
        blockDuration: 60 * 30 // block for 30 minutes
      }),
      
      // AI endpoints (expensive operations)
      ai: new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:ai',
        points: 10,
        duration: 60 * 60, // per hour
        blockDuration: 60 * 60 // block for 1 hour
      }),
      
      // File upload limit
      upload: new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:upload',
        points: 5,
        duration: 60 * 60, // per hour
        blockDuration: 60 * 60 * 2 // block for 2 hours
      })
    };
  }
  
  middleware(limiterName) {
    return async (req, res, next) => {
      try {
        const limiter = this.limiters[limiterName];
        if (!limiter) {
          return next();
        }
        
        // Use IP + user ID for authenticated requests
        const key = req.user ? `${req.ip}:${req.user.id}` : req.ip;
        
        await limiter.consume(key);
        
        // Add rate limit headers
        const rateLimitInfo = await limiter.get(key);
        if (rateLimitInfo) {
          res.setHeader('X-RateLimit-Limit', limiter.points);
          res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remainingPoints);
          res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimitInfo.msBeforeNext).toISOString());
        }
        
        next();
      } catch (error) {
        const retryAfter = Math.round(error.msBeforeNext / 1000) || 60;
        
        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Limit', this.limiters[limiterName].points);
        res.setHeader('X-RateLimit-Remaining', error.remainingPoints || 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + error.msBeforeNext).toISOString());
        
        res.status(429).json({
          type: 'https://api.dreamerai.io/errors/rate-limit',
          title: 'Rate Limit Exceeded',
          status: 429,
          detail: `You have exceeded the rate limit. Please try again in ${retryAfter} seconds.`,
          instance: req.originalUrl,
          retryAfter
        });
      }
    };
  }
}

const rateLimiter = new RateLimiter();

/**
 * Request Size Limiting
 */
const requestSizeLimit = {
  json: '10mb',
  urlencoded: '10mb',
  raw: '20mb'
};

/**
 * File Upload Security
 */
const fileUploadSecurity = () => {
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv'
  ]);
  
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }
    
    for (const fieldName in req.files) {
      const files = Array.isArray(req.files[fieldName]) 
        ? req.files[fieldName] 
        : [req.files[fieldName]];
      
      for (const file of files) {
        // Check file size
        if (file.size > maxFileSize) {
          return res.status(413).json({
            type: 'https://api.dreamerai.io/errors/file-too-large',
            title: 'File Too Large',
            status: 413,
            detail: `File ${file.name} exceeds the maximum size of ${maxFileSize / 1024 / 1024}MB`,
            instance: req.originalUrl
          });
        }
        
        // Check MIME type
        if (!allowedMimeTypes.has(file.mimetype)) {
          return res.status(415).json({
            type: 'https://api.dreamerai.io/errors/unsupported-file-type',
            title: 'Unsupported File Type',
            status: 415,
            detail: `File type ${file.mimetype} is not allowed`,
            instance: req.originalUrl
          });
        }
        
        // Additional file content validation could be added here
        // For example, checking magic bytes to ensure file type matches extension
      }
    }
    
    next();
  };
};

/**
 * Security Event Logging
 */
class SecurityLogger {
  constructor() {
    this.events = {
      AUTH_FAILURE: 'authentication_failure',
      AUTH_SUCCESS: 'authentication_success',
      SUSPICIOUS_ACTIVITY: 'suspicious_activity',
      RATE_LIMIT: 'rate_limit_exceeded',
      INJECTION_ATTEMPT: 'injection_attempt',
      XSS_ATTEMPT: 'xss_attempt',
      CSRF_FAILURE: 'csrf_failure',
      UNAUTHORIZED_ACCESS: 'unauthorized_access',
      DATA_BREACH_ATTEMPT: 'data_breach_attempt'
    };
  }
  
  async log(eventType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      details,
      severity: this.getSeverity(eventType)
    };
    
    // Log to console (replace with proper logging service)
    console.log('[SECURITY]', JSON.stringify(event));
    
    // Store in Redis for analysis
    const key = `security:events:${eventType}:${Date.now()}`;
    await redisClient.setex(key, 86400 * 7, JSON.stringify(event)); // Keep for 7 days
    
    // Trigger alerts for high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      this.triggerAlert(event);
    }
  }
  
  getSeverity(eventType) {
    const severityMap = {
      [this.events.AUTH_SUCCESS]: 'info',
      [this.events.AUTH_FAILURE]: 'medium',
      [this.events.RATE_LIMIT]: 'low',
      [this.events.SUSPICIOUS_ACTIVITY]: 'high',
      [this.events.INJECTION_ATTEMPT]: 'critical',
      [this.events.XSS_ATTEMPT]: 'high',
      [this.events.CSRF_FAILURE]: 'high',
      [this.events.UNAUTHORIZED_ACCESS]: 'high',
      [this.events.DATA_BREACH_ATTEMPT]: 'critical'
    };
    
    return severityMap[eventType] || 'medium';
  }
  
  triggerAlert(event) {
    // Implement alert mechanism (email, Slack, PagerDuty, etc.)
    console.error('[SECURITY ALERT]', event);
  }
}

const securityLogger = new SecurityLogger();

/**
 * IP-based Access Control
 */
const ipAccessControl = () => {
  // In production, load from database or environment
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Check blacklist first
    if (blacklist.includes(clientIp)) {
      securityLogger.log(securityLogger.events.UNAUTHORIZED_ACCESS, {
        ip: clientIp,
        reason: 'blacklisted_ip'
      });
      
      return res.status(403).json({
        type: 'https://api.dreamerai.io/errors/access-denied',
        title: 'Access Denied',
        status: 403,
        detail: 'Your IP address has been blocked',
        instance: req.originalUrl
      });
    }
    
    // If whitelist is configured, only allow whitelisted IPs
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      securityLogger.log(securityLogger.events.UNAUTHORIZED_ACCESS, {
        ip: clientIp,
        reason: 'not_whitelisted'
      });
      
      return res.status(403).json({
        type: 'https://api.dreamerai.io/errors/access-denied',
        title: 'Access Denied',
        status: 403,
        detail: 'Your IP address is not authorized',
        instance: req.originalUrl
      });
    }
    
    next();
  };
};

/**
 * API Versioning Security
 */
const apiVersioning = () => {
  const supportedVersions = ['v1', 'v2'];
  const deprecatedVersions = new Set([]);
  
  return (req, res, next) => {
    const version = req.params.version || req.headers['api-version'];
    
    if (version && deprecatedVersions.has(version)) {
      return res.status(410).json({
        type: 'https://api.dreamerai.io/errors/version-deprecated',
        title: 'API Version Deprecated',
        status: 410,
        detail: `API version ${version} has been deprecated`,
        instance: req.originalUrl
      });
    }
    
    if (version && !supportedVersions.includes(version)) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/unsupported-version',
        title: 'Unsupported API Version',
        status: 400,
        detail: `API version ${version} is not supported`,
        instance: req.originalUrl,
        supportedVersions
      });
    }
    
    next();
  };
};

module.exports = {
  securityHeaders,
  cspNonce,
  csrfProtection,
  xssProtection,
  sqlInjectionProtection,
  noSQLInjectionProtection,
  parameterPollutionProtection,
  rateLimiter,
  requestSizeLimit,
  fileUploadSecurity,
  securityLogger,
  ipAccessControl,
  apiVersioning
};