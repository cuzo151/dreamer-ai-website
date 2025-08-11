# Dreamer AI Solutions API - Implementation Guide

## Overview

This document provides implementation details for the Dreamer AI Solutions RESTful API. The API follows industry best practices for security, performance, and developer experience.

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis (optional, for distributed rate limiting)
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dreamer_ai
DB_SSL=false

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@dreamerai.io

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Keys (comma-separated for service-to-service)
VALID_API_KEYS=key1,key2,key3
```

### Database Setup

```bash
# Create database
createdb dreamer_ai

# Run migrations
cd backend/database
chmod +x setup.sh
./setup.sh

# Or manually
psql -U postgres -d dreamer_ai -f schema.sql
psql -U postgres -d dreamer_ai -f seed.sql
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Architecture

### Directory Structure

```
backend/
├── middleware/
│   ├── auth.js          # JWT authentication & authorization
│   ├── validation.js    # Request validation & error handling
│   └── rateLimiting.js  # Rate limiting strategies
├── routes/
│   ├── auth.js          # Authentication endpoints
│   ├── services.js      # Service management
│   ├── bookings.js      # Booking system
│   ├── chat.js          # AI chat integration
│   └── ...              # Other route modules
├── services/
│   ├── aiService.js     # AI integration logic
│   └── emailService.js  # Email notifications
├── database/
│   ├── index.js         # Database connection
│   ├── schema.sql       # Database schema
│   └── queries.sql      # Common queries
├── utils/
│   └── helpers.js       # Utility functions
├── server.js            # Express server setup
├── openapi.yaml         # API documentation
└── API_ARCHITECTURE.md  # Detailed architecture docs
```

### Key Features

1. **JWT Authentication**
   - Access tokens (1 hour expiry)
   - Refresh tokens (7 days expiry)
   - Token blacklisting for logout
   - Automatic token refresh

2. **Rate Limiting**
   - Multiple strategies: fixed window, sliding window, token bucket
   - Tier-based limits (anonymous, authenticated, premium, enterprise)
   - Redis support for distributed systems
   - Endpoint-specific limits

3. **Security**
   - Helmet.js for security headers
   - CORS with whitelisted origins
   - Input sanitization
   - SQL injection prevention
   - XSS protection
   - Password strength validation
   - 2FA support (optional)

4. **Error Handling**
   - RFC 7807 Problem Details format
   - Consistent error responses
   - Request ID tracking
   - Detailed validation errors

5. **API Documentation**
   - OpenAPI 3.0 specification
   - Swagger UI at `/api/v1/docs`
   - Interactive API testing
   - Code examples

## Frontend Integration

### Using the API Client

```typescript
import { apiClient, authService, servicesService } from './services/apiServices';

// Authentication
const login = async () => {
  try {
    const response = await authService.login('user@example.com', 'password');
    apiClient.setAuthTokens(response.data);
    console.log('Logged in:', response.data.user);
  } catch (error) {
    console.error('Login failed:', handleApiError(error));
  }
};

// Fetch services
const fetchServices = async () => {
  try {
    const response = await servicesService.list({ page: 1, limit: 10 });
    console.log('Services:', response.data);
    console.log('Pagination:', response.pagination);
  } catch (error) {
    console.error('Failed to fetch services:', handleApiError(error));
  }
};

// Create booking
const createBooking = async () => {
  try {
    const response = await bookingsService.create({
      serviceId: 'service-uuid',
      consultationType: 'discovery',
      scheduledAt: '2025-02-01T10:00:00Z',
      notes: 'Looking forward to discussing AI implementation'
    });
    console.log('Booking created:', response.data);
  } catch (error) {
    console.error('Booking failed:', handleApiError(error));
  }
};
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { servicesService, Service } from '../services/apiServices';

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await servicesService.list({ isActive: true });
        setServices(response.data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
};
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

Using Apache Bench:
```bash
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/v1/services
```

Using Artillery:
```bash
artillery quick --count 100 --num 10 http://localhost:5000/api/v1/health
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets
   - Rotate keys regularly

2. **Database Security**
   - Use parameterized queries
   - Enable Row Level Security (RLS)
   - Regular backups
   - Encrypt sensitive data

3. **API Security**
   - Always use HTTPS in production
   - Implement request signing for sensitive operations
   - Monitor for suspicious activity
   - Regular security audits

4. **Rate Limiting**
   - Adjust limits based on usage patterns
   - Implement progressive delays for failed auth
   - Use distributed rate limiting for scaled deployments

## Monitoring & Logging

### Recommended Tools

1. **Application Monitoring**
   - New Relic
   - DataDog
   - AppDynamics

2. **Error Tracking**
   - Sentry
   - Rollbar
   - Bugsnag

3. **Log Management**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - CloudWatch Logs
   - Splunk

### Health Check Endpoints

- `/health` - Basic health check
- `/health/ready` - Readiness probe (checks DB connection)
- `/health/live` - Liveness probe

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/dreamer_ai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=dreamer_ai
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring
- [ ] Configure log aggregation
- [ ] Enable database backups
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling
- [ ] Implement health checks
- [ ] Set up alerting
- [ ] Document runbooks

## API Versioning

The API uses URL-based versioning:
- Current: `/api/v1/`
- Legacy support redirects from `/api/` to `/api/v1/`

When introducing breaking changes:
1. Create new version endpoint (e.g., `/api/v2/`)
2. Maintain v1 for backward compatibility
3. Add deprecation notices
4. Provide migration guide
5. Set sunset date (minimum 6 months)

## Support

For API support:
- Email: api-support@dreamerai.io
- Documentation: https://api.dreamerai.io/v1/docs
- Status Page: https://status.dreamerai.io