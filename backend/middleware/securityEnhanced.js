const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Enhanced Security Middleware Collection
 * Implements advanced security measures beyond basic helmet configuration
 */

/**
 * Advanced Content Security Policy
 */
const advancedCSP = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: [
      "'self'", 
      "'unsafe-inline'", // Required for dynamic styles
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com"
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Limited for specific use cases
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://cdnjs.cloudflare.com",
      // Add nonce for dynamic scripts
      (req, res) => `'nonce-${res.locals.scriptNonce}'`
    ],
    imgSrc: [
      "'self'", 
      "data:", 
      "https:",
      "https://www.google-analytics.com",
      "https://via.placeholder.com" // For demo images
    ],
    connectSrc: [
      "'self'",
      "https://api.openai.com",
      "https://api.anthropic.com",
      "https://api.heygen.com",
      "https://www.google-analytics.com",
      process.env.API_URL || "https://api.dreamerai.io"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "https:"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
  },
  reportOnly: process.env.NODE_ENV === 'development'
});

/**
 * Generate CSP nonce for dynamic scripts
 */
const cspNonce = (req, res, next) => {
  res.locals.scriptNonce = crypto.randomBytes(16).toString('base64');
  next();
};

/**
 * Advanced rate limiting with multiple tiers
 */
const createAdvancedRateLimit = (config) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config;

  return rateLimit({
    windowMs,
    max: (req) => {
      // Dynamic rate limits based on user tier
      if (req.user?.role === 'premium') return max * 5;
      if (req.user?.role === 'enterprise') return max * 10;
      if (req.user?.role === 'admin') return max * 50;
      return max;
    },
    keyGenerator,
    message: (req) => ({
      type: 'https://api.dreamerai.io/errors/rate-limit',
      title: 'Rate Limit Exceeded',
      status: 429,
      detail: message,
      retryAfter: Math.ceil(windowMs / 1000),
      limits: {
        current: req.rateLimit?.current || 0,
        limit: req.rateLimit?.limit || max,
        remaining: req.rateLimit?.remaining || 0,
        reset: req.rateLimit?.reset || new Date(Date.now() + windowMs)
      }
    }),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    skip: (req) => {
      // Skip rate limiting for health checks
      if (req.path === '/health') return true;
      
      // Skip for admin users in development
      if (process.env.NODE_ENV === 'development' && req.user?.role === 'admin') {
        return true;
      }
      
      return false;
    }
  });
};

/**
 * Distributed rate limiting with Redis
 */
const distributedRateLimit = (options = {}) => {
  const RedisStore = require('rate-limit-redis');
  const redis = require('redis');
  
  let redisClient;
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
  } catch (error) {
    console.warn('Redis not available for distributed rate limiting');
    return createAdvancedRateLimit(options);
  }

  return createAdvancedRateLimit({
    ...options,
    store: new RedisStore({
      client: redisClient,
      prefix: 'dreamer_ai_rl:'
    })
  });
};

/**
 * Request signature verification for sensitive operations
 */
const requestSignatureVerification = (req, res, next) => {
  // Skip for non-sensitive endpoints
  if (!req.path.includes('/admin/') && !req.path.includes('/webhook/')) {
    return next();
  }

  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const body = JSON.stringify(req.body);

  if (!signature || !timestamp) {
    return res.status(401).json({
      type: 'https://api.dreamerai.io/errors/signature-required',
      title: 'Request Signature Required',
      status: 401,
      detail: 'X-Signature and X-Timestamp headers are required for this endpoint'
    });
  }

  // Check timestamp to prevent replay attacks
  const requestTime = parseInt(timestamp);
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (Math.abs(now - requestTime) > maxAge) {
    return res.status(401).json({
      type: 'https://api.dreamerai.io/errors/request-expired',
      title: 'Request Expired',
      status: 401,
      detail: 'Request timestamp is too old or too far in the future'
    });
  }

  // Verify signature
  const secret = process.env.REQUEST_SIGNATURE_SECRET || 'change-in-production';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({
      type: 'https://api.dreamerai.io/errors/invalid-signature',
      title: 'Invalid Request Signature',
      status: 401,
      detail: 'Request signature verification failed'
    });
  }

  next();
};

/**
 * JWT token enhancement with additional security
 */
const enhancedJWTValidation = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    // Check for token manipulation
    const { header, payload } = decoded;
    
    // Validate critical claims
    if (!payload.iat || !payload.exp) {
      throw new Error('Missing required token claims');
    }

    // Check for unusual token patterns that might indicate tampering
    const tokenAge = Date.now() / 1000 - payload.iat;
    if (tokenAge < 0 || tokenAge > 7 * 24 * 60 * 60) { // Max 7 days
      throw new Error('Token age is suspicious');
    }

    // Add security context to request
    req.securityContext = {
      tokenAge,
      algorithm: header.alg,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000)
    };

    next();
  } catch (error) {
    console.warn('JWT security validation warning:', error.message);
    next(); // Continue with normal JWT validation
  }
};

/**
 * SQL injection prevention with advanced patterns
 */
const advancedSQLInjectionPrevention = (req, res, next) => {
  const suspiciousPatterns = [
    /(\w+)\s*=\s*\1/i, // Self-referential comparisons
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/i,
    /'\s*(or|and)\s*'?\d+'?\s*=\s*'?\d+'?/i,
    /'\s*(or|and)\s*\w+\s*=\s*\w+/i,
    /benchmark\s*\(/i,
    /sleep\s*\(/i,
    /pg_sleep\s*\(/i
  ];

  const checkObject = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          console.warn(`Potential SQL injection attempt detected in ${path}: ${obj}`);
          throw new Error('Malicious input detected');
        }
      }
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        checkObject(obj[key], `${path}.${key}`);
      });
    }
  };

  try {
    checkObject(req.body, 'body');
    checkObject(req.query, 'query');
    checkObject(req.params, 'params');
    next();
  } catch (error) {
    return res.status(400).json({
      type: 'https://api.dreamerai.io/errors/malicious-input',
      title: 'Malicious Input Detected',
      status: 400,
      detail: 'Request contains potentially dangerous content'
    });
  }
};

/**
 * Advanced XSS protection with custom filters
 */
const advancedXSSProtection = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /livescript:/gi
  ];

  const cleanValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          console.warn(`Potential XSS attempt detected: ${value.substring(0, 100)}`);
          return value.replace(pattern, '[FILTERED]');
        }
      }
    }
    return value;
  };

  const cleanObject = (obj) => {
    if (typeof obj === 'string') {
      return cleanValue(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    } else if (obj && typeof obj === 'object') {
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        cleaned[key] = cleanObject(obj[key]);
      });
      return cleaned;
    }
    return obj;
  };

  req.body = cleanObject(req.body);
  req.query = cleanObject(req.query);
  next();
};

/**
 * CORS security enhancement
 */
const secureCORS = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  
  // Enhanced origin validation
  const isValidOrigin = (origin) => {
    if (!origin) return true; // Same-origin requests
    
    try {
      const originUrl = new URL(origin);
      
      // Check against allowed origins
      return allowedOrigins.some(allowed => {
        const allowedUrl = new URL(allowed.includes('://') ? allowed : `https://${allowed}`);
        return originUrl.hostname === allowedUrl.hostname ||
               originUrl.hostname.endsWith(`.${allowedUrl.hostname}`);
      });
    } catch (error) {
      return false;
    }
  };

  if (origin && !isValidOrigin(origin)) {
    return res.status(403).json({
      type: 'https://api.dreamerai.io/errors/cors-violation',
      title: 'CORS Policy Violation',
      status: 403,
      detail: `Origin ${origin} is not allowed`
    });
  }

  // Set secure CORS headers
  if (origin && isValidOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-Timestamp, X-Signature');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Security headers enforcement
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy / Permissions policy
  res.header('Permissions-Policy', 
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()'
  );
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * API key security validation
 */
const secureAPIKeyValidation = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return next();
  }

  // Check for common API key patterns that might indicate leakage
  const suspiciousPatterns = [
    /^(test|demo|example|sample)_/i,
    /^(sk-|pk-).{20,50}$/,
    /^[0-9a-f]{32,64}$/i // Hex patterns
  ];

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Warn about suspicious API keys in production
  if (isProduction) {
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(apiKey)) {
        console.warn(`Suspicious API key pattern detected: ${apiKey.substring(0, 10)}...`);
      }
    });
  }

  // Rate limit API key usage
  req.rateLimit = req.rateLimit || {};
  req.rateLimit.keyType = 'api_key';

  next();
};

/**
 * Security middleware collection
 */
const securityMiddleware = [
  cspNonce,
  advancedCSP,
  secureCORS,
  securityHeaders,
  enhancedJWTValidation,
  requestSignatureVerification,
  advancedSQLInjectionPrevention,
  mongoSanitize({
    replaceWith: '_'
  }),
  advancedXSSProtection,
  xss(),
  hpp({
    whitelist: ['page', 'limit', 'sort', 'filter']
  }),
  secureAPIKeyValidation
];

module.exports = {
  securityMiddleware,
  advancedCSP,
  cspNonce,
  createAdvancedRateLimit,
  distributedRateLimit,
  requestSignatureVerification,
  enhancedJWTValidation,
  advancedSQLInjectionPrevention,
  advancedXSSProtection,
  secureCORS,
  securityHeaders,
  secureAPIKeyValidation
};