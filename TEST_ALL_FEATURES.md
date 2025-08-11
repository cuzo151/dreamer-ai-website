# Dreamer AI Website - Comprehensive Feature Testing Guide

This guide provides step-by-step instructions to test all features of the Dreamer AI website to ensure everything works correctly before deployment.

## Prerequisites

1. **Local Development Setup**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Or manually start:
   # - PostgreSQL on port 5432
   # - Redis on port 6379
   # - Backend on port 3001
   # - Frontend on port 3000
   ```

2. **Environment Variables**
   - Ensure all required environment variables are set in backend/.env
   - Verify API keys for OpenAI, Anthropic, HeyGen, and ElevenLabs

3. **Database Setup**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

## Frontend Feature Testing

### 1. Navigation and UI Components

#### Homepage Navigation
- [ ] Open http://localhost:3000
- [ ] Verify the page loads without console errors
- [ ] Check that the loading animation appears and disappears
- [ ] Verify animated background is visible

#### Header Navigation
- [ ] Click each navigation link:
  - [ ] About - scrolls to About section
  - [ ] Services - scrolls to Services section
  - [ ] Capabilities - scrolls to Capabilities section
  - [ ] Contact - scrolls to Contact section
- [ ] Verify smooth scrolling animation
- [ ] Test sticky header on scroll
- [ ] Check mobile menu (resize browser < 768px)

#### Scroll Indicator
- [ ] Verify scroll progress indicator updates as you scroll
- [ ] Check it reaches 100% at page bottom

### 2. Hero Section
- [ ] Verify hero text animation on load
- [ ] Check "Get Started" CTA button hover effects
- [ ] Click "Get Started" - should scroll to Contact
- [ ] Verify responsive design on mobile

### 3. Video Showcase (HeyGen Integration)
- [ ] Check if video section loads
- [ ] Verify HeyGen avatar/video displays correctly
- [ ] Test play/pause controls if available
- [ ] Check responsive video sizing

### 4. About Section
- [ ] Verify all text content displays
- [ ] Check animations trigger on scroll
- [ ] Test any interactive elements
- [ ] Verify image loading

### 5. AI Tools Grid
- [ ] Verify all AI tool cards display
- [ ] Check hover effects on cards
- [ ] Test any links or buttons
- [ ] Verify icons/images load

### 6. Capabilities Section
- [ ] Check all capability cards render
- [ ] Test hover animations
- [ ] Verify content is readable
- [ ] Check responsive grid layout

### 7. Interactive Demos
- [ ] Test each interactive demo:
  - [ ] AI Chat Assistant
  - [ ] Code Generator
  - [ ] Image Analysis
  - [ ] Voice Synthesis
- [ ] Verify demo functionality
- [ ] Check error handling
- [ ] Test loading states

### 8. Contact Form
- [ ] Fill out contact form with valid data:
  ```
  Name: Test User
  Email: test@example.com
  Company: Test Company
  Message: This is a test message
  ```
- [ ] Submit form and verify success message
- [ ] Test form validation:
  - [ ] Empty fields show errors
  - [ ] Invalid email shows error
  - [ ] Short message shows error
- [ ] Check form reset after submission

### 9. Authentication Modal
- [ ] Click "Login" button in header
- [ ] Verify modal opens with smooth animation
- [ ] Test modal close (X button and outside click)

#### Login Form
- [ ] Enter valid credentials:
  ```
  Email: admin@dreamer-ai.com
  Password: Admin123!@#
  ```
- [ ] Verify successful login
- [ ] Check user info updates in header
- [ ] Test "Remember me" checkbox
- [ ] Test "Forgot password" link

#### Registration Form
- [ ] Switch to "Sign Up" tab
- [ ] Fill registration form:
  ```
  First Name: Test
  Last Name: User
  Email: newuser@example.com
  Password: Test123!@#
  Company: Test Corp
  ```
- [ ] Verify registration success
- [ ] Check email verification message
- [ ] Test form validation

#### Error Handling
- [ ] Test login with wrong credentials
- [ ] Test registration with existing email
- [ ] Verify error messages display correctly

### 10. ElevenLabs ConvAI Widget
- [ ] Check if ElevenLabs chat widget loads
- [ ] Test opening/closing the widget
- [ ] Send a test message
- [ ] Verify voice response (if configured)
- [ ] Test widget positioning

### 11. Footer
- [ ] Verify all footer links work
- [ ] Check social media icons
- [ ] Test newsletter subscription
- [ ] Verify copyright year is current

## API Endpoint Testing

### Setup API Testing
```bash
# Install API testing tool
npm install -g httpie
# Or use curl/Postman
```

### 1. Health Check
```bash
# Test health endpoint
curl http://localhost:3001/health
# Expected: { "status": "ok", "timestamp": "..." }

# Test API version
curl http://localhost:3001/api/version
# Expected: { "version": "1.0.0", "api": "Dreamer AI Solutions API" }
```

### 2. Authentication Endpoints

#### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!@#"
  }'
# Save the returned token for authenticated requests
```

#### Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

### 3. Contact/Lead Endpoints

#### Submit Contact Form
```bash
curl -X POST http://localhost:3001/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contact",
    "email": "contact@example.com",
    "company": "Test Company",
    "message": "This is a test contact message",
    "type": "general"
  }'
```

#### Newsletter Subscribe
```bash
curl -X POST http://localhost:3001/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newsletter@example.com"
  }'
```

### 4. Services Endpoints

#### List Services
```bash
curl http://localhost:3001/api/services
```

#### Get Service Details
```bash
curl http://localhost:3001/api/services/ai-consulting
```

### 5. User Profile (Authenticated)
```bash
# Replace YOUR_TOKEN with actual token
curl http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Booking Endpoints

#### Get Available Times
```bash
curl "http://localhost:3001/api/bookings/availability?serviceId=SERVICE_ID&date=2024-01-15"
```

#### Create Booking (Authenticated)
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "SERVICE_ID",
    "consultationType": "discovery",
    "scheduledAt": "2024-01-15T14:00:00Z",
    "notes": "Looking forward to discussing AI solutions"
  }'
```

### 7. Case Studies
```bash
# List published case studies
curl http://localhost:3001/api/case-studies

# Get specific case study
curl http://localhost:3001/api/case-studies/ai-retail-transformation
```

### 8. Testimonials
```bash
# List active testimonials
curl http://localhost:3001/api/testimonials?isFeatured=true
```

### 9. Chat/AI Endpoints

#### Get Available Models
```bash
curl http://localhost:3001/api/chat/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Send Chat Message
```bash
curl -X POST http://localhost:3001/api/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how can AI help my business?"}
    ],
    "model": "gpt-3.5-turbo"
  }'
```

### 10. Analytics (Admin Only)
```bash
# Track event (public)
curl -X POST http://localhost:3001/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "page_view",
    "pageUrl": "/",
    "properties": {"source": "direct"}
  }'

# Get dashboard (admin)
curl http://localhost:3001/api/analytics/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Performance Testing

### 1. Page Load Speed
```bash
# Test with Lighthouse
npm install -g lighthouse
lighthouse http://localhost:3000 --view

# Key metrics to check:
# - First Contentful Paint < 1.8s
# - Time to Interactive < 3.9s
# - Speed Index < 3.4s
```

### 2. API Response Times
```bash
# Test API performance
ab -n 100 -c 10 http://localhost:3001/api/health

# Check response times:
# - Health check < 50ms
# - Simple queries < 200ms
# - Complex queries < 500ms
```

### 3. Memory Leaks
- Open Chrome DevTools
- Navigate through all pages multiple times
- Monitor memory usage in Performance tab
- Check for increasing memory that doesn't get garbage collected

## Security Testing

### 1. Authentication Security
- [ ] Test JWT expiration
- [ ] Verify refresh token rotation
- [ ] Check unauthorized access to protected routes
- [ ] Test rate limiting on login endpoint

### 2. Input Validation
- [ ] Test SQL injection attempts in forms
- [ ] Try XSS in contact form
- [ ] Verify email validation
- [ ] Check file upload restrictions (if applicable)

### 3. CORS Configuration
- [ ] Verify API rejects requests from unauthorized origins
- [ ] Test preflight requests
- [ ] Check allowed methods and headers

## Mobile Testing

### 1. Responsive Design
Test on different screen sizes:
- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)

### 2. Touch Interactions
- [ ] Test all buttons and links with touch
- [ ] Verify swipe gestures work
- [ ] Check form inputs on mobile keyboard
- [ ] Test modal interactions

## Browser Compatibility

Test on major browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

### 1. Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test modal escape key
- [ ] Check skip links

### 2. Screen Reader
- [ ] Test with NVDA or JAWS
- [ ] Verify all images have alt text
- [ ] Check ARIA labels
- [ ] Test form announcements

### 3. Color Contrast
- [ ] Use Chrome DevTools to check contrast ratios
- [ ] Verify text is readable
- [ ] Test with color blindness simulator

## Production Readiness Checklist

### 1. Error Handling
- [ ] All API errors show user-friendly messages
- [ ] Forms handle network failures gracefully
- [ ] 404 pages work correctly
- [ ] 500 errors are logged but not exposed

### 2. Performance Optimization
- [ ] Images are optimized and lazy-loaded
- [ ] JavaScript bundles are minimized
- [ ] CSS is purged of unused styles
- [ ] Gzip compression is enabled

### 3. SEO
- [ ] Meta tags are present on all pages
- [ ] Sitemap.xml exists
- [ ] Robots.txt is configured
- [ ] Structured data is implemented

### 4. Analytics
- [ ] Google Analytics/Tag Manager is set up
- [ ] Events are tracking correctly
- [ ] Conversion goals are configured
- [ ] Error tracking is enabled

## Final Verification

Before marking the website as production-ready:

1. [ ] All tests pass without errors
2. [ ] No console errors or warnings
3. [ ] Performance metrics meet targets
4. [ ] Security best practices are followed
5. [ ] Accessibility standards are met
6. [ ] All integrations work correctly
7. [ ] Documentation is complete
8. [ ] Backup procedures are tested
9. [ ] Monitoring is configured
10. [ ] SSL certificate is valid

## Automated Testing Script

Create `test-all.sh`:
```bash
#!/bin/bash

echo "Running Dreamer AI Website Tests..."

# API Tests
echo "\n1. Testing API Health..."
curl -s http://localhost:3001/health | grep "ok" && echo "✓ Health check passed" || echo "✗ Health check failed"

# Frontend Tests
echo "\n2. Testing Frontend..."
curl -s http://localhost:3000 | grep "<title>" && echo "✓ Frontend loads" || echo "✗ Frontend failed"

# Run Jest tests
echo "\n3. Running unit tests..."
cd backend && npm test
cd ../frontend && npm test

# Run Cypress tests
echo "\n4. Running E2E tests..."
npm run cypress:run

echo "\nAll tests completed!"
```

Make it executable: `chmod +x test-all.sh`

## Reporting Issues

If any tests fail:
1. Document the exact error message
2. Note the steps to reproduce
3. Check browser console for errors
4. Review server logs
5. Create a GitHub issue with details

Remember: A feature isn't complete until it's tested!