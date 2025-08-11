# Dreamer AI Solutions - Production Deployment Guide

This guide provides instructions for deploying the Dreamer AI Solutions website to production at dreamerai.io.

## Prerequisites

1. **Server Requirements:**
   - Ubuntu 20.04 LTS or newer (or compatible Linux distribution)
   - Docker and Docker Compose installed
   - At least 4GB RAM and 20GB storage
   - Ports 80 and 443 open for web traffic
   - Port 3000 open for API (can be restricted to internal network)

2. **Domain Configuration:**
   - Domain: dreamerai.io (from GoDaddy)
   - DNS A record pointing to your server IP
   - Optional: CNAME record for www.dreamerai.io pointing to dreamerai.io

3. **SSL Certificate:**
   - The deployment uses Let's Encrypt for automatic SSL certificates
   - Ensure your domain is properly pointed to the server before deployment

## Pre-Deployment Checklist

1. **Update .env.production:**
   - [ ] Generate secure JWT_SECRET (use `openssl rand -base64 32`)
   - [ ] Generate secure JWT_REFRESH_SECRET
   - [ ] Generate secure SESSION_SECRET
   - [ ] Generate secure COOKIE_SECRET
   - [ ] Set strong database password
   - [ ] Set strong Redis password
   - [ ] Add your OpenAI API key
   - [ ] Add your Anthropic API key (if using)
   - [ ] Configure SMTP settings for email
   - [ ] Update CORS_ORIGIN to https://dreamerai.io

2. **API Keys:**
   - [ ] OpenAI API key for AI features
   - [ ] SendGrid or other SMTP service for emails
   - [ ] Stripe keys if using payment features

## Deployment Steps

### 1. Clone the Repository
```bash
git clone [repository-url]
cd dreamer-ai-website
```

### 2. Configure Environment
```bash
# Copy and edit production environment file
cp .env.production.example .env.production
nano .env.production
# Update all placeholder values with secure production values
```

### 3. Run Deployment Script
```bash
./deploy.sh
```

The deployment script will:
- Validate environment configuration
- Build frontend and backend
- Create and start Docker containers
- Run database migrations
- Perform health checks

### 4. Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API health
curl https://api.dreamerai.io/health
```

### 5. SSL Certificate Setup

If using Traefik (recommended):
- SSL certificates are automatically obtained from Let's Encrypt
- Ensure email in docker-compose.prod.yml is correct

If using Nginx with manual SSL:
1. Place certificates in `./certs/` directory
2. Update nginx.conf with certificate paths
3. Restart frontend container

## Post-Deployment

### 1. Monitor Application
```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 2. Database Backup
Set up automated database backups:
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U dreamer dreamerai_prod > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U dreamer dreamerai_prod < backup.sql
```

### 3. Updates and Maintenance
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./deploy.sh
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Rebuild containers
docker-compose -f docker-compose.prod.yml build --no-cache
```

### SSL Certificate Issues
```bash
# Check Traefik logs
docker-compose -f docker-compose.prod.yml logs traefik

# Verify DNS is pointing correctly
nslookup dreamerai.io
```

### Database Connection Issues
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec backend npm run db:test

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres
```

## Security Recommendations

1. **Firewall Configuration:**
   ```bash
   # Allow only necessary ports
   ufw allow 22/tcp  # SSH
   ufw allow 80/tcp  # HTTP
   ufw allow 443/tcp # HTTPS
   ufw enable
   ```

2. **Regular Updates:**
   - Keep Docker and system packages updated
   - Regularly update Node.js dependencies
   - Monitor for security advisories

3. **Monitoring:**
   - Set up application monitoring (e.g., Datadog, New Relic)
   - Configure log aggregation
   - Set up uptime monitoring

## Support

For deployment issues or questions:
- Email: jlasalle@dreamerai.io
- Technical Support: support@dreamerai.io