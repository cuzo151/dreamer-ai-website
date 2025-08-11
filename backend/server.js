const express = require('express');
require('dotenv').config();

// Import enhanced middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logging');
const { securityMiddleware } = require('./middleware/securityEnhanced');
const { 
  advancedCompression, 
  responseCache, 
  timing, 
  memoryMonitoring, 
  initializeRedis,
  paginationOptimization,
  responseSizeOptimization
} = require('./middleware/performance');

// Import services
const heygenService = require('./services/heygenService');
const seoService = require('./services/seoService');

// Import routes
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const caseStudiesRoutes = require('./routes/case-studies');
const chatRoutes = require('./routes/chat');
const contactRoutes = require('./routes/contact');
const healthRoutes = require('./routes/health');
const leadRoutes = require('./routes/leads');
const newsletterRoutes = require('./routes/newsletter');
const serviceRoutes = require('./routes/services');
const showcaseRoutes = require('./routes/showcase');
const testimonialsRoutes = require('./routes/testimonials');
const userRoutes = require('./routes/users');

// Import new API routes
const heygenRoutes = require('./routes/heygen');
const widgetRoutes = require('./routes/widgets');
const seoRoutes = require('./routes/seo');
const elevenLabsRoutes = require('./routes/elevenlabs');

// Create Express app
const app = express();

// Initialize services
async function initializeServices() {
  try {
    await initializeRedis();
    await heygenService.initialize();
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.warn('⚠️ Some services failed to initialize:', error.message);
  }
}

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Performance and monitoring middleware
app.use(timing);
app.use(memoryMonitoring);

// Enhanced security middleware
app.use(securityMiddleware);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'application/ld+json']
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Advanced compression
app.use(advancedCompression);

// Request logging
app.use(requestLogger);

// Pagination helper
app.use(paginationOptimization);

// Response optimization
app.use(responseSizeOptimization);

// Response caching for GET requests (5 minutes TTL)
app.use(responseCache({ 
  ttl: 300,
  skipCache: (req) => req.method !== 'GET' || req.headers.authorization || req.path.includes('/admin')
}));

// Health check routes
app.use('/health', healthRoutes);

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    api: 'Dreamer AI Solutions API',
    documentation: '/api/docs'
  });
});

// SEO routes (served at root level for robots.txt, sitemap.xml)
app.use('/', seoRoutes);

// Mount API routes with version prefix
const API_VERSION = 'v1';

// Core API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/services`, serviceRoutes);
app.use(`/api/${API_VERSION}/bookings`, bookingRoutes);
app.use(`/api/${API_VERSION}/leads`, leadRoutes);
app.use(`/api/${API_VERSION}/contact`, contactRoutes);
app.use(`/api/${API_VERSION}/showcase`, showcaseRoutes);
app.use(`/api/${API_VERSION}/newsletter`, newsletterRoutes);
app.use(`/api/${API_VERSION}/case-studies`, caseStudiesRoutes);
app.use(`/api/${API_VERSION}/testimonials`, testimonialsRoutes);
app.use(`/api/${API_VERSION}/chat`, chatRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// New enhanced API routes
app.use(`/api/${API_VERSION}/heygen`, heygenRoutes);
app.use(`/api/${API_VERSION}/widgets`, widgetRoutes);
app.use(`/api/${API_VERSION}/seo`, seoRoutes);
app.use(`/api/${API_VERSION}/elevenlabs`, elevenLabsRoutes);

// Legacy API support (redirect to v1)
app.use('/api/auth', (req, res) => res.redirect(308, `/api/${API_VERSION}/auth${req.url}`));
app.use('/api/services', (req, res) => res.redirect(308, `/api/${API_VERSION}/services${req.url}`));
app.use('/api/chat', (req, res) => res.redirect(308, `/api/${API_VERSION}/chat${req.url}`));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log('🚀 Dreamer AI Solutions API Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/${API_VERSION}/docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🤖 SEO Sitemap: http://localhost:${PORT}/sitemap.xml`);
  console.log(`🛡️ Security: Enhanced security middleware active`);
  console.log(`⚡ Performance: Advanced caching and compression enabled`);
  console.log('='.repeat(50));
  
  // Initialize services asynchronously
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;