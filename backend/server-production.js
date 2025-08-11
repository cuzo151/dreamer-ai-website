const crypto = require('crypto');

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Import security middleware

// Import other middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logging');
const {
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
  ipAccessControl
} = require('./middleware/security');
const { 
  requestIdMiddleware, 
  responseTimeMiddleware,
  sanitizeInput,
  corsOptions 
} = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const contactRoutes = require('./routes/contact');
const healthRoutes = require('./routes/health');
const leadRoutes = require('./routes/leads');
const serviceRoutes = require('./routes/services');
const showcaseRoutes = require('./routes/showcase');
const userRoutes = require('./routes/users');

// Security Configuration
console.log('🔒 Initializing security middleware...');

// Basic security middleware
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);

// IP-based access control (if configured)
if (process.env.IP_WHITELIST || process.env.IP_BLACKLIST) {
  app.use(ipAccessControl());
}

// Security headers with CSP nonce
app.use(cspNonce);
app.use(securityHeaders());

// Enhanced Helmet configuration for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'nonce-{NONCE}'",
        "https://apis.google.com",
        "https://www.google-analytics.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Consider replacing with nonces in production
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
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
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
}));

// CORS configuration with production origins
const corsConfig = {
  origin (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};
app.use(cors(corsConfig));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Disable X-Powered-By header
app.disable('x-powered-by');

// Compression with security considerations
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: requestSizeLimit.json,
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: requestSizeLimit.urlencoded,
  parameterLimit: 1000
}));

// Security middleware stack
app.use(sanitizeInput);
app.use(xssProtection());
app.use(sqlInjectionProtection());
app.use(noSQLInjectionProtection);
app.use(parameterPollutionProtection);
app.use(fileUploadSecurity());

// Request logging with security context
app.use(requestLogger);

// Health check endpoints (no auth required)
app.use('/health', healthRoutes);

// CSP violation reporting endpoint
app.post('/api/v1/security/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];
  securityLogger.log(securityLogger.events.SUSPICIOUS_ACTIVITY, {
    type: 'csp_violation',
    report,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  res.status(204).end();
});

// API versioning
app.get('/api/version', (req, res) => {
  res.json({
    version: process.env.API_VERSION || '1.0.0',
    api: 'Dreamer AI Solutions API',
    environment: process.env.NODE_ENV,
    documentation: '/api/v1/docs'
  });
});

// Apply general rate limiting to all API routes
app.use('/api/', rateLimiter.middleware('api'));

// Apply CSRF protection to state-changing operations
app.use('/api/', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Mount routes with specific security policies
app.use('/api/auth', rateLimiter.middleware('auth'), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/showcase', showcaseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    type: 'https://api.dreamerai.io/errors/not-found',
    title: 'Not Found',
    status: 404,
    detail: 'The requested resource was not found',
    instance: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  // Log security-relevant errors
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    securityLogger.log(securityLogger.events.AUTH_FAILURE, {
      error: err.message,
      ip: req.ip,
      url: req.originalUrl
    });
  } else if (err.type === 'entity.parse.failed') {
    securityLogger.log(securityLogger.events.SUSPICIOUS_ACTIVITY, {
      error: 'Invalid JSON payload',
      ip: req.ip,
      url: req.originalUrl
    });
  } else if (err.message && err.message.includes('CORS')) {
    securityLogger.log(securityLogger.events.SUSPICIOUS_ACTIVITY, {
      error: 'CORS violation',
      origin: req.get('origin'),
      ip: req.ip,
      url: req.originalUrl
    });
  }
  
  errorHandler(err, req, res, next);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Secure Dreamer AI server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
  console.log(`🛡️  Security features: ${process.env.NODE_ENV === 'production' ? 'ENABLED' : 'DEVELOPMENT MODE'}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  WARNING: Not running in production mode. Some security features may be disabled.');
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    // Close Redis connections
    // Clean up any other resources
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  securityLogger.log(securityLogger.events.SUSPICIOUS_ACTIVITY, {
    error: 'Uncaught exception',
    message: err.message,
    stack: err.stack
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  securityLogger.log(securityLogger.events.SUSPICIOUS_ACTIVITY, {
    error: 'Unhandled rejection',
    reason
  });
});

module.exports = app;