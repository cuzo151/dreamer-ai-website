# Dreamer AI Solutions - GoDaddy Deployment Guide

This comprehensive guide will walk you through deploying the Dreamer AI Solutions website to dreamerai.io on GoDaddy hosting with proper SSL and security configurations.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [GoDaddy Hosting Setup](#godaddy-hosting-setup)
3. [Domain Configuration](#domain-configuration)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Server Requirements](#server-requirements)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Maintenance and Updates](#maintenance-and-updates)

## Prerequisites

Before starting the deployment:

1. **GoDaddy Account Access**
   - Admin access to GoDaddy account
   - Access to dreamerai.io domain management
   - VPS or Dedicated Server hosting (shared hosting won't work for Node.js apps)

2. **Local Development Environment**
   - Node.js 18+ installed
   - Git installed
   - All environment variables configured
   - Application tested locally

3. **Required Services**
   - PostgreSQL database
   - Redis cache server
   - SMTP email service
   - OpenAI/Anthropic API keys

## GoDaddy Hosting Setup

### Option 1: VPS Hosting (Recommended)

1. **Purchase VPS Hosting**
   - Go to GoDaddy > Hosting > VPS
   - Choose at minimum:
     - 2 vCPUs
     - 4GB RAM
     - 60GB SSD storage
     - Ubuntu 22.04 LTS

2. **Initial Server Setup**
   ```bash
   # SSH into your server
   ssh root@your-server-ip

   # Update system packages
   apt update && apt upgrade -y

   # Create a non-root user
   adduser dreamer
   usermod -aG sudo dreamer

   # Set up firewall
   ufw allow OpenSSH
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 3000/tcp  # For Node.js app
   ufw enable
   ```

3. **Install Required Software**
   ```bash
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs

   # Install PM2 for process management
   npm install -g pm2

   # Install Nginx
   apt install nginx -y

   # Install PostgreSQL
   apt install postgresql postgresql-contrib -y

   # Install Redis
   apt install redis-server -y

   # Install Certbot for SSL
   apt install certbot python3-certbot-nginx -y

   # Install Git
   apt install git -y
   ```

### Option 2: Managed Node.js Hosting

If GoDaddy offers managed Node.js hosting:
1. Purchase Node.js hosting plan
2. Ensure it supports:
   - Node.js 18+
   - PostgreSQL database
   - Redis cache
   - Custom domain
   - SSL certificates

## Domain Configuration

### DNS Settings

1. **Access DNS Management**
   - Log into GoDaddy
   - Go to My Products > Domains
   - Click "Manage" next to dreamerai.io
   - Select "DNS"

2. **Configure A Records**
   ```
   Type: A
   Name: @
   Value: [Your VPS IP Address]
   TTL: 600

   Type: A
   Name: www
   Value: [Your VPS IP Address]
   TTL: 600
   ```

3. **Optional: Configure Subdomains**
   ```
   Type: A
   Name: api
   Value: [Your VPS IP Address]
   TTL: 600

   Type: A
   Name: admin
   Value: [Your VPS IP Address]
   TTL: 600
   ```

## SSL Certificate Setup

### Using Let's Encrypt (Free SSL)

1. **Ensure DNS is Propagated**
   ```bash
   # Check DNS propagation
   dig dreamerai.io
   dig www.dreamerai.io
   ```

2. **Install SSL Certificate**
   ```bash
   # Stop Nginx temporarily
   systemctl stop nginx

   # Get certificate
   certbot certonly --standalone -d dreamerai.io -d www.dreamerai.io

   # Start Nginx
   systemctl start nginx
   ```

3. **Auto-renewal Setup**
   ```bash
   # Test renewal
   certbot renew --dry-run

   # Add to crontab
   crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Using GoDaddy SSL (If purchased)

1. Generate CSR on your server
2. Submit CSR to GoDaddy
3. Download certificate files
4. Install on server

## Server Requirements

### System Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: 2+ cores
- **Storage**: 60GB+ SSD
- **Bandwidth**: Unlimited preferred

### Software Requirements
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Nginx (latest stable)
- PM2 (process manager)
- Git

## Deployment Process

### 1. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER dreamer WITH PASSWORD 'your-secure-password';
CREATE DATABASE dreamerai_production OWNER dreamer;
GRANT ALL PRIVILEGES ON DATABASE dreamerai_production TO dreamer;
\q

# Run migrations
cd /home/dreamer/dreamer-ai-website/backend
npm run db:migrate
```

### 2. Application Deployment

```bash
# As dreamer user
su - dreamer

# Clone repository
git clone https://github.com/yourusername/dreamer-ai-website.git
cd dreamer-ai-website

# Backend setup
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values
nano .env

# Frontend setup
cd ../frontend
npm install
npm run build

# Copy build to Nginx directory
sudo cp -r build/* /var/www/dreamerai.io/
```

### 3. Environment Variables Configuration

Create `/home/dreamer/dreamer-ai-website/backend/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://dreamer:your-password@localhost:5432/dreamerai_production

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
SESSION_SECRET=your-production-session-secret

# CORS
ALLOWED_ORIGINS=https://dreamerai.io,https://www.dreamerai.io

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@dreamerai.io

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# HeyGen Integration
HEYGEN_API_KEY=your-heygen-key

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/dreamerai.io`:

```nginx
server {
    listen 80;
    server_name dreamerai.io www.dreamerai.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dreamerai.io www.dreamerai.io;

    ssl_certificate /etc/letsencrypt/live/dreamerai.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dreamerai.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:; media-src 'self' https:; object-src 'none'; frame-src 'self' https://www.heygen.com https://elevenlabs.io; base-uri 'self'; form-action 'self'; frame-ancestors 'self';" always;

    # Frontend
    root /var/www/dreamerai.io;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for chat
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/dreamerai.io /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. PM2 Process Management

Create `/home/dreamer/dreamer-ai-website/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dreamer-ai-backend',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start the application:
```bash
cd /home/dreamer/dreamer-ai-website
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Post-Deployment Verification

### 1. Basic Checks

```bash
# Check if services are running
systemctl status nginx
systemctl status postgresql
systemctl status redis
pm2 status

# Check logs
pm2 logs
tail -f /var/log/nginx/error.log
```

### 2. Website Testing Checklist

- [ ] Homepage loads correctly (https://dreamerai.io)
- [ ] SSL certificate is valid (check padlock icon)
- [ ] Navigation menu works
- [ ] Smooth scrolling functions
- [ ] Contact form submits successfully
- [ ] Authentication modal opens/closes
- [ ] Login functionality works
- [ ] Registration creates new users
- [ ] Interactive demos load
- [ ] Video showcase (HeyGen) displays
- [ ] ElevenLabs ConvAI widget loads
- [ ] API health check returns OK (/api/health)
- [ ] All images and assets load
- [ ] Mobile responsive design works
- [ ] Page load time is acceptable

### 3. Security Verification

```bash
# Test SSL configuration
curl -I https://dreamerai.io

# Check firewall
ufw status

# Verify headers
curl -I https://dreamerai.io | grep -i security
```

### 4. Performance Testing

```bash
# Load test (install Apache Bench first)
ab -n 100 -c 10 https://dreamerai.io/

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://dreamerai.io/
```

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Daily**
   - Check PM2 status: `pm2 status`
   - Monitor logs: `pm2 logs --lines 100`
   - Check disk space: `df -h`

2. **Weekly**
   - Update system packages: `apt update && apt upgrade`
   - Check SSL certificate expiry: `certbot certificates`
   - Review error logs
   - Database backup

3. **Monthly**
   - Security updates
   - Performance optimization
   - Clean old logs
   - Review analytics

### Deployment Updates

```bash
# Pull latest changes
cd /home/dreamer/dreamer-ai-website
git pull origin main

# Backend update
cd backend
npm install --production
pm2 restart dreamer-ai-backend

# Frontend update
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/dreamerai.io/

# Run migrations if needed
cd ../backend
npm run db:migrate
```

### Backup Strategy

1. **Database Backup Script** (`/home/dreamer/backup-db.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/dreamer/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U dreamer dreamerai_production > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

2. **Automated Backups**:
```bash
# Add to crontab
0 2 * * * /home/dreamer/backup-db.sh
```

### Monitoring Setup

1. **Basic Monitoring**:
   - Use PM2 monitoring: `pm2 monit`
   - Set up email alerts for downtime
   - Monitor server resources

2. **GoDaddy Monitoring** (if available):
   - Enable server monitoring
   - Set up alerts for high CPU/memory usage
   - Configure uptime monitoring

## Troubleshooting

### Common Issues and Solutions

1. **502 Bad Gateway**
   - Check if Node.js app is running: `pm2 status`
   - Restart app: `pm2 restart all`
   - Check logs: `pm2 logs`

2. **Database Connection Errors**
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Check credentials in .env file
   - Test connection: `psql -U dreamer -d dreamerai_production`

3. **SSL Certificate Issues**
   - Renew certificate: `certbot renew`
   - Check certificate status: `certbot certificates`
   - Verify Nginx config: `nginx -t`

4. **Performance Issues**
   - Check server resources: `htop`
   - Review PM2 cluster mode settings
   - Optimize database queries
   - Enable Redis caching

5. **CORS Errors**
   - Verify ALLOWED_ORIGINS in .env
   - Check Nginx headers
   - Restart backend after changes

## Support and Resources

- **GoDaddy Support**: 24/7 technical support
- **Documentation**: Keep this guide updated
- **Monitoring**: Set up alerts for critical issues
- **Backups**: Regular automated backups

## Final Notes

- Always test changes in a staging environment first
- Keep security updates current
- Monitor server resources regularly
- Document any custom configurations
- Maintain regular backups
- Review logs for security threats

Remember to keep all credentials secure and never commit them to version control!