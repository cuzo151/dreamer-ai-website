# Dreamer AI Solutions - Production Deployment Checklist

This checklist ensures all critical items are addressed before deploying to production at dreamerai.io.

## Pre-Deployment Checklist

### Environment Configuration
- [ ] All environment variables are set in production .env file
- [ ] Database connection string points to production database
- [ ] Redis connection is configured for production
- [ ] JWT secrets are strong and unique (not the development defaults)
- [ ] CORS origins include https://dreamerai.io and https://www.dreamerai.io
- [ ] API keys are valid and have production limits:
  - [ ] OpenAI API key
  - [ ] Anthropic API key
  - [ ] HeyGen API key
  - [ ] ElevenLabs API key
- [ ] SMTP credentials are configured for production email sending
- [ ] NODE_ENV is set to "production"

### Database Setup
- [ ] Production database is created and accessible
- [ ] All migrations have been run successfully:
  ```bash
  npm run db:migrate
  ```
- [ ] Admin user account is created:
  ```bash
  npm run seed:admin
  ```
- [ ] Database backups are configured and tested
- [ ] Connection pooling is optimized for production load

### Security Hardening
- [ ] All default passwords have been changed
- [ ] Rate limiting is configured appropriately
- [ ] HTTPS is enforced (no HTTP access except redirect)
- [ ] Security headers are properly configured in Nginx
- [ ] Input validation is enabled on all endpoints
- [ ] SQL injection protection is verified
- [ ] XSS protection is enabled
- [ ] CSRF tokens are implemented where needed
- [ ] File upload restrictions are in place
- [ ] API authentication is required for protected routes

### Frontend Build
- [ ] Production build completed without errors:
  ```bash
  cd frontend && npm run build
  ```
- [ ] All environment variables use production values
- [ ] Source maps are excluded from production build
- [ ] Assets are minified and optimized
- [ ] Images are compressed and optimized
- [ ] Unused CSS is purged
- [ ] Bundle size is acceptable (< 500KB initial load)

### API Testing
- [ ] All API endpoints return expected responses
- [ ] Authentication flow works correctly
- [ ] Error responses don't leak sensitive information
- [ ] API rate limiting is functional
- [ ] CORS is properly configured
- [ ] WebSocket connections work (if applicable)

### Third-Party Integrations
- [ ] HeyGen video integration is functional
- [ ] ElevenLabs ConvAI widget loads and works
- [ ] Email sending works through SMTP
- [ ] AI API calls (OpenAI/Anthropic) are functional
- [ ] All API rate limits are understood and handled

### Performance Optimization
- [ ] Gzip compression is enabled
- [ ] Static assets have cache headers
- [ ] Database queries are optimized
- [ ] Redis caching is implemented
- [ ] CDN is configured (if using one)
- [ ] Load testing has been performed
- [ ] Response times are acceptable:
  - [ ] API health check < 100ms
  - [ ] Page load time < 3 seconds
  - [ ] Time to interactive < 5 seconds

### Monitoring and Logging
- [ ] Application logs are configured and accessible
- [ ] Error tracking is set up (e.g., Sentry)
- [ ] Uptime monitoring is configured
- [ ] Performance monitoring is enabled
- [ ] Database query logging is configured
- [ ] Log rotation is set up
- [ ] Alerts are configured for critical errors

### DNS and SSL
- [ ] DNS A records point to correct server IP
- [ ] SSL certificate is valid and installed
- [ ] Certificate auto-renewal is configured
- [ ] WWW redirect is working
- [ ] HSTS is enabled
- [ ] SSL configuration gets A+ on SSL Labs test

### Backup and Recovery
- [ ] Database backup script is scheduled
- [ ] Backup restoration has been tested
- [ ] Application code is backed up (Git)
- [ ] Environment files are securely backed up
- [ ] Disaster recovery plan is documented

### Legal and Compliance
- [ ] Privacy Policy is accessible
- [ ] Terms of Service is accessible
- [ ] Cookie consent is implemented (if needed)
- [ ] GDPR compliance is verified (if applicable)
- [ ] Accessibility standards are met (WCAG 2.1 AA)

## Deployment Steps

### 1. Final Local Testing
```bash
# Run all tests
cd backend && npm test
cd ../frontend && npm test

# Run the comprehensive test suite
./test-all.sh
```

### 2. Deploy Backend
```bash
# On production server
cd /home/dreamer/dreamer-ai-website
git pull origin main
cd backend
npm install --production
npm run db:migrate
pm2 restart dreamer-ai-backend
```

### 3. Deploy Frontend
```bash
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/dreamerai.io/
```

### 4. Verify Deployment
- [ ] Website loads at https://dreamerai.io
- [ ] API health check passes
- [ ] Can create a test account
- [ ] Can submit contact form
- [ ] All interactive features work

### 5. Post-Deployment
- [ ] Clear CDN cache (if applicable)
- [ ] Test from multiple locations
- [ ] Monitor error logs for first hour
- [ ] Check performance metrics
- [ ] Verify backup job runs successfully

## Rollback Plan

If issues arise:

1. **Quick Rollback** (< 5 minutes)
   ```bash
   # Revert to previous backend
   pm2 restart dreamer-ai-backend --update-env
   
   # Revert frontend
   sudo cp -r /backup/previous-build/* /var/www/dreamerai.io/
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   pg_restore -U dreamer -d dreamerai_production backup_file.sql
   ```

3. **Full Rollback**
   ```bash
   # Revert to previous Git commit
   git checkout [previous-commit-hash]
   npm install
   pm2 restart all
   ```

## Contact Information

**Technical Issues:**
- Lead Developer: [Contact Info]
- DevOps: [Contact Info]

**Business Issues:**
- Project Manager: jlasalle@dreamerai.io
- Support: support@dreamerai.io

## Sign-Off

- [ ] Development Team Leader: _________________ Date: _______
- [ ] QA/Testing Lead: _________________ Date: _______
- [ ] Security Review: _________________ Date: _______
- [ ] Project Manager: _________________ Date: _______
- [ ] Final Approval: _________________ Date: _______

---

**Remember:** Never deploy on Fridays unless absolutely necessary!