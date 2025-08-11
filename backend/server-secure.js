const fs = require('fs');
const https = require('https');
const path = require('path');
const tls = require('tls');

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Import enhanced security middleware
const {
  authenticate,
  requireMFA,
  deviceTrust,
  authRateLimit
} = require('./middleware/authEnhanced');
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
  ipAccessControl,
  apiVersioning
} = require('./middleware/security');

// Import enhanced validation middleware
const {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  responseTimeMiddleware,
  sanitizeInput,
  corsOptions
} = require('./middleware/validation');

// Import enhanced authentication

// Security configuration
const configureSecurityMiddleware = (app) => {
  // Basic security
  app.use(requestIdMiddleware);
  app.use(responseTimeMiddleware);
  app.use(ipAccessControl());
  
  // Security headers with CSP nonce
  app.use(cspNonce);
  app.use(securityHeaders());
  
  // CORS with security
  app.use(cors({
    ...corsOptions,
    credentials: true,
    optionsSuccessStatus: 200
  }));
  
  // Compression with security considerations
  app.use(compression({
    filter: (req, res) => {
      // Don't compress responses with no-transform directive
      if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6 // Balance between compression and CPU usage
  }));
  
  // Request logging with security context
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        userId: req.user?.id
      };
      
      // Log security-relevant events
      if (res.statusCode >= 400) {
        securityLogger.log(
          res.statusCode === 401 ? securityLogger.events.AUTH_FAILURE : securityLogger.events.SUSPICIOUS_ACTIVITY,
          logData
        );
      }
      
      console.log(JSON.stringify(logData));
    });
    
    next();
  });
  
  // Body parsing with security limits
  app.use(express.json({ 
    limit: requestSizeLimit.json,
    verify: (req, res, buf) => {
      // Store raw body for signature verification
      req.rawBody = buf.toString('utf8');
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: requestSizeLimit.urlencoded,
    parameterLimit: 1000 // Prevent parameter pollution
  }));
  
  app.use(express.raw({ 
    limit: requestSizeLimit.raw,
    type: 'application/octet-stream'
  }));
  
  // Security middleware stack
  app.use(sanitizeInput);
  app.use(xssProtection());
  app.use(sqlInjectionProtection());
  app.use(noSQLInjectionProtection);
  app.use(parameterPollutionProtection);
  
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', true);
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  // File upload security
  app.use(fileUploadSecurity());
};

// Apply security middleware
configureSecurityMiddleware(app);

// API versioning
app.use('/api/:version', apiVersioning());

// Health check endpoints (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Dreamer AI Solutions Backend',
    version: process.env.API_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check critical dependencies
    const checks = {
      database: 'ok', // Implement actual DB check
      redis: 'ok', // Implement actual Redis check
      encryption: 'ok' // Verify encryption service
    };
    
    res.json({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Security report endpoint
app.post('/api/v1/security/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];
  securityLogger.log(securityLogger.events.SUSPICIOUS_ACTIVITY, {
    type: 'csp_violation',
    report
  });
  res.status(204).end();
});

// API v1 router with security
const apiV1 = express.Router();

// Apply general rate limiting
apiV1.use(rateLimiter.middleware('api'));

// CSRF protection for state-changing operations
apiV1.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const contactRoutes = require('./routes/contact');
const showcaseRoutes = require('./routes/showcase');

// API Documentation with security
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
apiV1.use('/docs', authenticate, swaggerUi.serve);
apiV1.get('/docs', authenticate, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dreamer AI Solutions API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// OpenAPI spec endpoints (require authentication)
apiV1.get('/openapi.yaml', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

apiV1.get('/openapi.json', authenticate, (req, res) => {
  res.json(swaggerDocument);
});

// API routes with specific security policies
apiV1.use('/auth', authRateLimit, authRoutes);
apiV1.use('/chat', authenticate, deviceTrust, rateLimiter.middleware('ai'), chatRoutes);
apiV1.use('/showcase', rateLimiter.middleware('api'), showcaseRoutes);
apiV1.use('/contact', authenticate, rateLimiter.middleware('api'), contactRoutes);

// Admin routes with MFA
apiV1.use('/admin', authenticate, requireMFA, require('./routes/admin'));

// Mount API v1
app.use('/api/v1', apiV1);

// Legacy API redirect with deprecation warning
app.use('/api/:endpoint', (req, res) => {
  res.setHeader('X-API-Deprecation-Warning', 'Legacy endpoints are deprecated. Use /api/v1 instead.');
  res.redirect(301, `/api/v1/${req.params.endpoint}${req.url}`);
});

// Static file serving with security
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (/\.(js|css)$/.test(path)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
}

// 404 handler
app.use(notFoundHandler);

// Global error handler with security considerations
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
  }
  
  errorHandler(err, req, res, next);
});

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    // db.close();
    
    // Close Redis connections
    // redis.quit();
    
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// HTTPS configuration for production
let server;
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_HTTPS === 'true') {
  // TLS configuration
  const tlsOptions = {
    key: fs.readFileSync(process.env.TLS_KEY_PATH),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH),
    ca: process.env.TLS_CA_PATH ? fs.readFileSync(process.env.TLS_CA_PATH) : undefined,
    
    // Security settings
    secureProtocol: 'TLSv1_2_method',
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384'
    ].join(':'),
    honorCipherOrder: true,
    
    // Disable insecure protocols
    secureOptions: 
      tls.constants.SSL_OP_NO_SSLv2 |
      tls.constants.SSL_OP_NO_SSLv3 |
      tls.constants.SSL_OP_NO_TLSv1 |
      tls.constants.SSL_OP_NO_TLSv1_1
  };
  
  // Create HTTPS server
  server = https.createServer(tlsOptions, app);
  
  // Redirect HTTP to HTTPS
  const httpApp = express();
  httpApp.use((req, res) => {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
  });
  httpApp.listen(PORT, () => {
    console.log(`HTTP redirect server running on port ${PORT}`);
  });
  
  // Start HTTPS server
  server.listen(HTTPS_PORT, () => {
    console.log(`Secure Dreamer AI Solutions backend running on port ${HTTPS_PORT}`);
    console.log(`API Documentation: https://localhost:${HTTPS_PORT}/api/v1/docs`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
} else {
  // HTTP server for development
  server = app.listen(PORT, () => {
    console.log(`Dreamer AI Solutions backend running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api/v1/docs`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.warn('WARNING: Running in development mode without HTTPS');
    }
  });
}

// Security monitoring
setInterval(() => {
  // Monitor server health
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
    console.warn('High memory usage detected:', memoryUsage);
  }
  
  // Additional monitoring can be added here
}, 60000); // Check every minute

module.exports = app;