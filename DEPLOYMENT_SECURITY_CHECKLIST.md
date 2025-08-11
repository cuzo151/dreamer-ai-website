# Production Deployment Security Checklist for dreamerai.io

## Pre-Deployment Security Checklist

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production` and fill all values
- [ ] Generate strong, unique secrets for all secret fields (minimum 64 characters)
- [ ] Verify all API keys are production keys, not development/test keys
- [ ] Ensure `.env.production` is in `.gitignore` and never committed
- [ ] Set `NODE_ENV=production` in all production servers

### 2. SSL/TLS Configuration
- [ ] Obtain SSL certificate from trusted CA for dreamerai.io and api.dreamerai.io
- [ ] Configure SSL with strong ciphers only (TLS 1.2 minimum)
- [ ] Enable HSTS with includeSubDomains and preload
- [ ] Submit domain to HSTS preload list
- [ ] Configure SSL certificate renewal automation (Let's Encrypt/Certbot)
- [ ] Test SSL configuration with SSL Labs (target A+ rating)

### 3. Server Configuration
- [ ] Use `server-secure.js` instead of `server.js` for production
- [ ] Enable all security middleware in production
- [ ] Configure proper CORS origins (only dreamerai.io domains)
- [ ] Set up reverse proxy (Nginx/Apache) with security headers
- [ ] Disable directory listing and server version disclosure
- [ ] Configure firewall rules (only allow necessary ports)

### 4. Database Security
- [ ] Use strong, unique database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Configure database firewall to only allow app servers
- [ ] Set up regular automated backups with encryption
- [ ] Enable database audit logging
- [ ] Remove default database users and test databases
- [ ] Apply principle of least privilege for database user

### 5. Authentication & Authorization
- [ ] Verify JWT secret rotation is enabled
- [ ] Confirm password requirements are enforced (12+ chars, complexity)
- [ ] Enable MFA for admin accounts
- [ ] Configure account lockout after failed attempts
- [ ] Set up session timeout and concurrent session limits
- [ ] Verify refresh token rotation is working
- [ ] Test password reset flow for security

### 6. API Security
- [ ] Enable rate limiting on all endpoints
- [ ] Implement stricter limits on authentication endpoints
- [ ] Configure CSRF protection for state-changing operations
- [ ] Enable request size limits
- [ ] Implement input validation on all endpoints
- [ ] Set up API versioning
- [ ] Configure API documentation authentication

### 7. Data Protection
- [ ] Enable encryption at rest for database
- [ ] Enable encryption in transit (TLS) for all communications
- [ ] Implement field-level encryption for sensitive data
- [ ] Configure secure session storage (Redis with password)
- [ ] Set up data retention policies
- [ ] Implement secure file upload restrictions
- [ ] Enable audit logging for data access

### 8. Monitoring & Logging
- [ ] Set up centralized logging (ELK Stack/CloudWatch)
- [ ] Configure security event monitoring
- [ ] Set up alerts for suspicious activities
- [ ] Enable performance monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Implement log rotation and retention

### 9. Infrastructure Security
- [ ] Configure DDoS protection (CloudFlare/AWS Shield)
- [ ] Set up Web Application Firewall (WAF)
- [ ] Enable intrusion detection system (IDS)
- [ ] Configure automated security patching
- [ ] Set up infrastructure monitoring
- [ ] Implement backup and disaster recovery plan
- [ ] Configure CDN for static assets

### 10. Compliance & Privacy
- [ ] Implement GDPR compliance measures
- [ ] Set up cookie consent mechanism
- [ ] Create and publish privacy policy
- [ ] Implement data export/deletion endpoints
- [ ] Configure PII data masking in logs
- [ ] Set up terms of service acceptance
- [ ] Document data processing activities

## Deployment Steps

### 1. Pre-deployment Testing
```bash
# Run security tests
npm audit --production
npm run test:security

# Check for known vulnerabilities
npx snyk test

# Run OWASP dependency check
dependency-check --project "Dreamer AI" --scan .
```

### 2. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install security updates
sudo unattended-upgrades

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban
```

### 3. Application Deployment
```bash
# Clone repository
git clone https://github.com/dreamer-ai/production.git
cd production

# Install production dependencies only
npm ci --production

# Build frontend with production optimizations
cd frontend && npm run build

# Set up process manager
npm install -g pm2
pm2 start backend/server-secure.js --name dreamerai-api

# Configure Nginx reverse proxy
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Post-deployment Verification
- [ ] Test all API endpoints with production URL
- [ ] Verify SSL certificate is working correctly
- [ ] Check security headers using securityheaders.com
- [ ] Run penetration testing tools
- [ ] Verify rate limiting is working
- [ ] Test authentication flows
- [ ] Confirm error messages don't leak sensitive info
- [ ] Verify CORS is properly configured

## Security Testing Commands

```bash
# Test security headers
curl -I https://api.dreamerai.io

# Test rate limiting
for i in {1..10}; do curl https://api.dreamerai.io/api/v1/auth/login; done

# Check SSL configuration
nmap --script ssl-enum-ciphers -p 443 dreamerai.io

# Test for common vulnerabilities
nikto -h https://dreamerai.io
```

## Emergency Response Plan

### In Case of Security Incident:
1. Immediately activate incident response team
2. Isolate affected systems
3. Preserve logs and evidence
4. Assess scope of breach
5. Notify affected users if required
6. Apply security patches
7. Document incident and response
8. Conduct post-mortem analysis

## Regular Maintenance

### Daily
- [ ] Monitor security alerts
- [ ] Review authentication logs
- [ ] Check rate limit violations

### Weekly
- [ ] Review security patches
- [ ] Analyze traffic patterns
- [ ] Update WAF rules if needed

### Monthly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review and rotate secrets
- [ ] Update dependencies
- [ ] Backup restoration test

### Quarterly
- [ ] Full security assessment
- [ ] Update security policies
- [ ] Security training for team
- [ ] Review compliance requirements

## Important Security Contacts

- Security Team Lead: security@dreamerai.io
- DevOps On-Call: +1-XXX-XXX-XXXX
- External Security Consultant: consultant@security-firm.com
- Incident Response: incident-response@dreamerai.io

## Security Tools & Resources

- SSL Test: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/
- OWASP: https://owasp.org/
- CVE Database: https://cve.mitre.org/
- Snyk: https://snyk.io/

---

**Last Updated:** July 2024
**Next Review:** October 2024
**Document Owner:** Security Team