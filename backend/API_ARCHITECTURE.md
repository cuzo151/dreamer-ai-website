# Dreamer AI Solutions - RESTful API Architecture

## Overview

This document outlines the comprehensive RESTful API architecture for Dreamer AI Solutions, following industry best practices for security, scalability, and maintainability.

## API Design Principles

1. **RESTful Standards**: Follow REST architectural constraints with proper HTTP methods and status codes
2. **Versioning**: URL-based versioning (e.g., `/api/v1/`)
3. **Security First**: JWT-based authentication, RBAC authorization, rate limiting
4. **Consistent Response Format**: Standardized JSON response structure
5. **HATEOAS**: Hypermedia links for API discoverability
6. **Error Handling**: RFC 7807 Problem Details for error responses

## Base URL Structure

```
Production: https://api.dreamerai.io/v1
Staging: https://api-staging.dreamerai.io/v1
Development: http://localhost:5000/api/v1
```

## Authentication & Authorization

### JWT-Based Authentication Flow

1. **Login**: POST `/auth/login` → Returns access_token & refresh_token
2. **Refresh**: POST `/auth/refresh` → Returns new access_token
3. **Logout**: POST `/auth/logout` → Invalidates tokens
4. **Register**: POST `/auth/register` → Creates new user account
5. **Verify Email**: GET `/auth/verify-email/:token` → Verifies email address
6. **Password Reset**: POST `/auth/password-reset` → Initiates reset flow
7. **Password Update**: PUT `/auth/password-reset/:token` → Updates password

### Token Structure

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpc2lzYXJlZnJlc2h0b2tlbg...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_expires_in": 604800
}
```

### Authorization Headers

```
Authorization: Bearer <access_token>
```

## API Endpoints Structure

### 1. Authentication & User Management

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/password-reset
PUT    /auth/password-reset/:token
GET    /auth/verify-email/:token
POST   /auth/2fa/enable
POST   /auth/2fa/verify
DELETE /auth/2fa/disable

GET    /users/profile
PUT    /users/profile
DELETE /users/profile
GET    /users/:id (admin only)
GET    /users (admin only)
PUT    /users/:id (admin only)
DELETE /users/:id (admin only)
```

### 2. Service Management

```
GET    /services
GET    /services/:slug
POST   /services (admin only)
PUT    /services/:id (admin only)
DELETE /services/:id (admin only)
```

### 3. Service Bookings

```
GET    /bookings
GET    /bookings/:id
POST   /bookings
PUT    /bookings/:id
DELETE /bookings/:id
GET    /bookings/availability
POST   /bookings/:id/confirm
POST   /bookings/:id/cancel
GET    /bookings/calendar (admin only)
```

### 4. Contact & Lead Management

```
POST   /contact/submit
GET    /contact/submissions (admin only)
GET    /contact/submissions/:id (admin only)
PUT    /contact/submissions/:id (admin only)

GET    /leads
GET    /leads/:id
POST   /leads
PUT    /leads/:id
DELETE /leads/:id
POST   /leads/:id/activities
GET    /leads/:id/activities
PUT    /leads/:id/status
POST   /leads/:id/assign
```

### 5. Case Studies & Testimonials

```
GET    /case-studies
GET    /case-studies/:slug
POST   /case-studies (admin only)
PUT    /case-studies/:id (admin only)
DELETE /case-studies/:id (admin only)
POST   /case-studies/:id/publish (admin only)

GET    /testimonials
GET    /testimonials/:id
POST   /testimonials (admin only)
PUT    /testimonials/:id (admin only)
DELETE /testimonials/:id (admin only)
```

### 6. AI Chat Integration

```
GET    /chat/conversations
GET    /chat/conversations/:id
POST   /chat/conversations
DELETE /chat/conversations/:id
POST   /chat/conversations/:id/messages
GET    /chat/conversations/:id/messages
POST   /chat/completions
GET    /chat/models
```

### 7. Content Management

```
GET    /content/pages
GET    /content/pages/:slug
POST   /content/pages (admin only)
PUT    /content/pages/:id (admin only)
DELETE /content/pages/:id (admin only)
POST   /content/pages/:id/publish (admin only)

POST   /content/upload (admin only)
GET    /content/media (admin only)
DELETE /content/media/:id (admin only)
```

### 8. Newsletter & Communications

```
POST   /newsletter/subscribe
DELETE /newsletter/unsubscribe/:token
GET    /newsletter/subscriptions (admin only)
POST   /newsletter/campaigns (admin only)
GET    /newsletter/campaigns (admin only)
```

### 9. Analytics & Reporting

```
POST   /analytics/events
GET    /analytics/dashboard (admin only)
GET    /analytics/reports/users (admin only)
GET    /analytics/reports/conversions (admin only)
GET    /analytics/reports/revenue (admin only)
GET    /analytics/reports/engagement (admin only)
```

### 10. Admin Dashboard

```
GET    /admin/stats
GET    /admin/users
GET    /admin/bookings
GET    /admin/leads
GET    /admin/revenue
GET    /admin/audit-logs
GET    /admin/system-health
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-01-25T10:30:00Z",
    "version": "1.0",
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "links": {
    "self": "/api/v1/users/123",
    "next": "/api/v1/users/124",
    "prev": "/api/v1/users/122"
  }
}
```

### Error Response (RFC 7807)

```json
{
  "type": "https://api.dreamerai.io/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The email field is required",
  "instance": "/api/v1/auth/register",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "FIELD_REQUIRED"
    }
  ],
  "timestamp": "2025-01-25T10:30:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_more": true
  },
  "links": {
    "first": "/api/v1/users?page=1&per_page=20",
    "last": "/api/v1/users?page=5&per_page=20",
    "next": "/api/v1/users?page=2&per_page=20",
    "prev": null
  }
}
```

## Rate Limiting Strategy

### Tiers

1. **Anonymous**: 100 requests/15 minutes
2. **Authenticated**: 1000 requests/15 minutes
3. **Premium**: 5000 requests/15 minutes
4. **Enterprise**: Custom limits

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1612345678
X-RateLimit-Reset-After: 900
```

### Rate Limit Response

```json
{
  "type": "https://api.dreamerai.io/errors/rate-limit",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit of 1000 requests per 15 minutes",
  "retry_after": 900
}
```

## Security Best Practices

### 1. Authentication & Authorization

- JWT tokens with short expiration (1 hour for access, 7 days for refresh)
- Secure token storage (HttpOnly cookies for web, secure storage for mobile)
- Role-Based Access Control (RBAC) with permissions
- Two-factor authentication support
- Password strength requirements and breach detection

### 2. API Security

- HTTPS only in production
- CORS configuration with whitelisted origins
- Request signing for sensitive operations
- API key management for service-to-service communication
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection with content security policies

### 3. Rate Limiting & DDoS Protection

- Token bucket algorithm for rate limiting
- Distributed rate limiting with Redis
- Progressive delays for failed authentication attempts
- IP-based blocking for suspicious activity
- CloudFlare or AWS WAF integration

### 4. Data Security

- Encryption at rest for sensitive data
- PII data masking in logs
- Audit logging for all data access
- GDPR compliance with data retention policies
- Regular security audits and penetration testing

## API Documentation

### OpenAPI Specification

The complete API documentation is available in OpenAPI 3.0 format at:
- Development: http://localhost:5000/api/v1/docs
- Production: https://api.dreamerai.io/v1/docs

### Interactive Documentation

Swagger UI available at:
- Development: http://localhost:5000/api/v1/swagger
- Production: https://api.dreamerai.io/v1/swagger

## Monitoring & Observability

### 1. Logging

- Structured logging with correlation IDs
- Log aggregation with ELK stack or CloudWatch
- Error tracking with Sentry
- Performance monitoring with New Relic or DataDog

### 2. Metrics

- Request/response times
- Error rates by endpoint
- Active users and sessions
- Database query performance
- Cache hit rates

### 3. Health Checks

```
GET /health
GET /health/ready
GET /health/live
```

## Deployment & Infrastructure

### 1. Environment Configuration

- Environment-based configuration
- Secrets management with AWS Secrets Manager or HashiCorp Vault
- Feature flags for gradual rollouts

### 2. Scaling Strategy

- Horizontal scaling with load balancers
- Database read replicas
- Redis for caching and sessions
- CDN for static assets
- Queue-based processing for async operations

### 3. CI/CD Pipeline

- Automated testing (unit, integration, E2E)
- Code quality checks (ESLint, SonarQube)
- Security scanning (OWASP ZAP, Snyk)
- Blue-green deployments
- Automatic rollback on failures

## Client SDK Support

Official SDKs planned for:
- JavaScript/TypeScript
- Python
- Java
- Go
- Mobile (React Native, Flutter)

## Versioning Strategy

- Major versions in URL path (v1, v2)
- Minor versions via headers for gradual migration
- Deprecation notices with sunset dates
- Backward compatibility for at least 6 months

## Testing Strategy

### 1. Unit Tests
- Individual endpoint testing
- Service layer testing
- Utility function testing

### 2. Integration Tests
- Database integration
- External service mocking
- Authentication flow testing

### 3. Contract Tests
- Consumer-driven contracts
- API versioning compatibility

### 4. Load Tests
- Performance benchmarks
- Stress testing
- Spike testing

## Compliance & Standards

- GDPR compliance for EU users
- CCPA compliance for California users
- SOC 2 Type II certification
- ISO 27001 compliance
- OWASP Top 10 security practices