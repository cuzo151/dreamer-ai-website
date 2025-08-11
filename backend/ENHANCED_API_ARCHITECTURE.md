# Dreamer AI Solutions - Enhanced API Architecture

## Overview

This document outlines the comprehensive API architecture improvements for Dreamer AI Solutions, implementing enterprise-grade patterns for scalability, security, and performance.

## Architecture Summary

### **Current State Analysis**
✅ **Strengths Identified:**
- Solid Express.js foundation with proper middleware structure
- JWT authentication with secure token handling
- Comprehensive OpenAPI/Swagger documentation
- PostgreSQL database with parameterized queries
- Basic security measures (Helmet, CORS, rate limiting)

⚠️ **Areas Improved:**
- Added API Gateway pattern for widget integrations
- Implemented comprehensive HeyGen API integration
- Enhanced security with advanced middleware
- Added performance optimizations with Redis caching
- Implemented SEO-friendly API endpoints
- Added proper API versioning with legacy support

## New Architecture Components

### 1. **HeyGen API Integration** (`/api/v1/heygen`)

**Service Layer:** `/backend/services/heygenService.js`
- Centralized HeyGen API management with secure key handling
- Advanced rate limiting (10 requests/minute per user)
- Redis-based caching for avatars/voices (2-hour TTL)
- Webhook processing for video generation status
- Error handling with retry mechanisms

**API Endpoints:**
```
GET    /api/v1/heygen/avatars        # Get available avatars (cached)
GET    /api/v1/heygen/voices         # Get available voices (cached)
POST   /api/v1/heygen/videos         # Generate avatar video
GET    /api/v1/heygen/videos/:id     # Get video status
GET    /api/v1/heygen/videos         # User's video history
POST   /api/v1/heygen/webhook        # Status update webhook
```

**Key Features:**
- ✅ Proxy API calls to secure API keys
- ✅ Intelligent caching strategy
- ✅ Rate limiting with user tiers
- ✅ Webhook signature verification
- ✅ Request deduplication for concurrent calls

### 2. **Widget API Gateway** (`/api/v1/widgets`)

**Middleware:** `/backend/middleware/apiGateway.js`
- JWT-based widget authentication with domain validation
- Centralized request/response transformation
- Permission-based access control
- API versioning support (v1, v2)
- Built-in analytics tracking

**Widget Endpoints:**
```
POST   /api/v1/widgets/chat                    # Widget chat completion
POST   /api/v1/widgets/showcase/analyze        # Document analysis widget  
GET    /api/v1/widgets/heygen/avatars         # Limited avatar list
POST   /api/v1/widgets/heygen/generate        # Video generation (limited)
GET    /api/v1/widgets/status                 # Widget health check
GET    /api/v1/widgets/config                 # Widget configuration
```

**Security Features:**
- ✅ Domain-restricted API keys
- ✅ Permission-based endpoint access
- ✅ Rate limiting per widget (1000 req/hour)
- ✅ Request/response size limitations
- ✅ CORS protection with origin validation

### 3. **SEO API Endpoints** (`/api/v1/seo`)

**Service Layer:** `/backend/services/seoService.js`
- Dynamic meta tag generation for SSR
- Automatic sitemap.xml generation
- Structured data (JSON-LD) creation
- robots.txt generation
- Breadcrumb and FAQ structured data

**SEO Endpoints:**
```
GET    /sitemap.xml                          # Dynamic XML sitemap
GET    /robots.txt                           # Search engine directives  
GET    /api/v1/seo/meta/*                    # Meta tags for any route
GET    /api/v1/seo/structured-data/:type     # JSON-LD structured data
GET    /api/v1/seo/prerender/*              # Prerendered page data
POST   /api/v1/seo/clear-cache              # Clear SEO caches
GET    /api/v1/seo/performance              # SEO metrics
```

**Features:**
- ✅ Server-side rendering support
- ✅ Dynamic sitemap with service/case study pages
- ✅ Open Graph and Twitter Card meta tags
- ✅ Schema.org structured data
- ✅ Crawler-friendly rate limiting

### 4. **Performance Optimizations**

**Middleware:** `/backend/middleware/performance.js`

#### **Advanced Caching Strategy:**
- **Redis-based response caching** (5-minute TTL for GET requests)
- **Request deduplication** for concurrent identical requests
- **Service-level caching** (HeyGen avatars: 2 hours, SEO data: 24 hours)
- **Conditional caching** (skip auth'd requests, admin endpoints)

#### **Compression & Optimization:**
- **Advanced gzip compression** with content-type specific strategies
- **Response size optimization** (remove null/undefined fields)
- **Memory monitoring** with automatic garbage collection
- **Database query optimization** (read replica routing for GET requests)

#### **Monitoring & Health:**
- **Response time tracking** with slow request warnings (>1s)
- **Memory usage monitoring** with threshold alerts (>512MB)
- **Service health checks** (Redis, database connections)
- **Performance metrics** exposed via `/health` endpoint

### 5. **Enhanced Security**

**Middleware:** `/backend/middleware/securityEnhanced.js`

#### **Advanced Security Measures:**
- **Enhanced CSP** with nonce generation for dynamic scripts
- **Multi-tier rate limiting** based on user roles (premium: 5x, enterprise: 10x)
- **Request signature verification** for sensitive operations
- **Advanced SQL injection prevention** with pattern detection
- **Enhanced XSS protection** with custom filtering rules
- **JWT security validation** with token age and manipulation checks

#### **Security Headers:**
```javascript
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## API Versioning Strategy

### **Current Implementation:**
- **Primary API:** `/api/v1/` (all new endpoints)
- **Legacy Support:** `/api/` routes redirect to `/api/v1/` (308 redirects)
- **Version Detection:** URL path, headers, or query parameters
- **Backward Compatibility:** v1 maintained for minimum 12 months

### **Breaking Changes Policy:**
1. New major version for breaking changes (`/api/v2/`)
2. Deprecation notices 6 months before sunset
3. Migration guides and tools provided
4. Automated testing for version compatibility

## Database & Connection Optimization

### **Connection Pooling:**
- **Read Replica Routing:** GET requests use read replicas
- **Connection Timeouts:** 10s standard, 30s for analytics
- **Pool Management:** Min 2, Max 20 connections per instance
- **Query Caching:** Enabled for non-authenticated GET requests

### **Performance Enhancements:**
- **Prepared Statements:** All queries use parameterized statements
- **Query Optimization:** Pagination helpers with efficient OFFSET/LIMIT
- **Connection Context:** Row Level Security (RLS) with user context
- **Health Monitoring:** Connection pool status in health checks

## Rate Limiting Strategy

### **Multi-Tier Rate Limits:**
```javascript
Anonymous Users:    100 requests/15min
Authenticated:      1,000 requests/15min  
Premium:            5,000 requests/15min
Enterprise:         25,000 requests/15min
Admin:              No limits (dev), 50x (prod)
```

### **Endpoint-Specific Limits:**
- **Authentication:** 5 requests/15min (failed attempts)
- **HeyGen API:** 10 requests/min per user
- **Widget API:** 1,000 requests/hour per widget
- **SEO Endpoints:** 1,000 requests/15min (generous for crawlers)

### **Advanced Features:**
- **Distributed Rate Limiting:** Redis-backed for horizontal scaling
- **Burst Protection:** Sliding window with burst allowance
- **Crawler Detection:** Skip limits for known search engine bots
- **Progressive Delays:** Exponential backoff for repeated violations

## Error Handling & Monitoring

### **RFC 7807 Problem Details:**
```json
{
  "type": "https://api.dreamerai.io/errors/rate-limit",
  "title": "Rate Limit Exceeded", 
  "status": 429,
  "detail": "Too many requests from this IP",
  "instance": "/api/v1/chat",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_abc123"
}
```

### **Monitoring & Observability:**
- **Request Tracing:** Unique request IDs for debugging
- **Performance Metrics:** Response times, memory usage, cache hit rates
- **Security Events:** Failed authentications, suspicious patterns
- **Health Checks:** `/health`, `/health/ready`, `/health/live` endpoints

## Deployment Considerations

### **Environment Configuration:**
```bash
# Core Settings
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# API Keys
HEYGEN_API_KEY=your_heygen_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Security
JWT_SECRET=secure_random_secret_256_bits
REQUEST_SIGNATURE_SECRET=webhook_signature_secret
WIDGET_JWT_SECRET=widget_specific_secret

# Performance
RESPONSE_CACHE_TTL=300
COMPRESSION_LEVEL=6
MEMORY_LIMIT=512MB
```

### **Production Optimizations:**
- **Load Balancer:** Multiple instances with sticky sessions for widgets
- **CDN Integration:** Static assets and API responses
- **Database Scaling:** Read replicas, connection pooling
- **Redis Cluster:** Distributed caching and rate limiting
- **Monitoring:** APM tools, log aggregation, alerting

## API Documentation & Testing

### **OpenAPI Specification:**
- **Comprehensive Schema:** Request/response models for all endpoints
- **Interactive Documentation:** Swagger UI at `/api/v1/docs`
- **Code Examples:** Multiple language SDKs generated
- **Authentication Flows:** JWT and API key examples

### **Testing Strategy:**
- **Unit Tests:** Service layer and middleware testing
- **Integration Tests:** End-to-end API workflows
- **Load Testing:** Performance benchmarks under load
- **Security Testing:** OWASP compliance, penetration testing
- **Widget Testing:** Cross-domain and embedding scenarios

## Migration Path

### **Phase 1: Foundation (Completed)**
- ✅ Enhanced security middleware implementation
- ✅ Performance optimization layer
- ✅ API versioning with legacy support
- ✅ Basic caching and monitoring

### **Phase 2: API Gateway (Completed)**
- ✅ Widget API gateway with authentication
- ✅ HeyGen service integration with caching
- ✅ SEO API endpoints with structured data
- ✅ Advanced rate limiting with Redis

### **Phase 3: Production Readiness (Next)**
- 🔄 Database migrations and connection optimization
- 🔄 Comprehensive monitoring and alerting
- 🔄 Load testing and performance tuning
- 🔄 Documentation and SDK generation

### **Phase 4: Advanced Features (Future)**
- 📋 GraphQL endpoint for complex queries
- 📋 WebSocket support for real-time features
- 📋 Advanced analytics and reporting
- 📋 Multi-tenant architecture support

## Key Architectural Decisions

### **What to Keep:**
✅ **Express.js Framework** - Mature, well-documented, extensive middleware ecosystem
✅ **PostgreSQL Database** - ACID compliance, excellent performance, JSON support
✅ **JWT Authentication** - Stateless, scalable, industry standard
✅ **OpenAPI Documentation** - Comprehensive, interactive, tooling support
✅ **Modular Route Structure** - Clean separation of concerns, maintainable

### **What was Enhanced:**
🔧 **Security Middleware** - Added advanced CSP, XSS, SQL injection protection
🔧 **Rate Limiting** - Multi-tier, distributed, Redis-backed with user role awareness
🔧 **Caching Strategy** - Redis-based response caching, service-level caching
🔧 **Error Handling** - RFC 7807 compliance, structured error responses
🔧 **Performance** - Compression, response optimization, memory monitoring

### **What was Added:**
➕ **API Gateway** - Widget authentication, request transformation, versioning
➕ **HeyGen Integration** - Secure API proxy, caching, webhook processing
➕ **SEO Endpoints** - Dynamic sitemaps, meta tags, structured data
➕ **Advanced Monitoring** - Health checks, performance metrics, request tracing

## Performance Benchmarks

### **Response Time Targets:**
- **Authentication:** < 200ms (95th percentile)
- **Static Data (Cached):** < 50ms (95th percentile)
- **Database Queries:** < 500ms (95th percentile)
- **HeyGen API Proxy:** < 2000ms (95th percentile)
- **SEO Endpoints:** < 100ms (95th percentile)

### **Throughput Targets:**
- **Concurrent Connections:** 1,000 per instance
- **Requests per Second:** 500 per instance
- **Database Connections:** 20 max per instance
- **Memory Usage:** < 512MB per instance
- **Cache Hit Rate:** > 80% for cacheable requests

This enhanced API architecture provides a robust, scalable, and secure foundation for Dreamer AI Solutions, supporting current needs while being extensible for future growth.