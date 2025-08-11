# Dreamer AI Website - GoDaddy Deployment Guide

This comprehensive guide walks you through deploying your Dreamer AI website to GoDaddy hosting for the domain dreamerai.io.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [GoDaddy Hosting Options](#godaddy-hosting-options)
3. [Recommended Hosting Setup](#recommended-hosting-setup)
4. [DNS Configuration](#dns-configuration)
5. [Database Setup](#database-setup)
6. [File Upload Methods](#file-upload-methods)
7. [Frontend Deployment](#frontend-deployment)
8. [Backend Deployment](#backend-deployment)
9. [SSL Certificate Setup](#ssl-certificate-setup)
10. [Environment Variables](#environment-variables)
11. [Post-Deployment Checklist](#post-deployment-checklist)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:
- ✓ Domain dreamerai.io purchased from GoDaddy
- ✓ Working local development environment with Docker
- ✓ All API keys (ElevenLabs, HeyGen, OpenAI/Anthropic)
- ✓ GoDaddy account with hosting plan purchased
- ✓ FTP client (FileZilla recommended)
- ✓ Git installed locally

## GoDaddy Hosting Options

### 1. **Shared Hosting** (NOT Recommended)
- **Price**: $5.99-$19.99/month
- **Limitations**: 
  - No Node.js support
  - Limited database options
  - No Redis support
  - Cannot run custom backend services

### 2. **VPS Hosting** (Recommended)
- **Price**: $19.99-$69.99/month
- **Benefits**:
  - Full root access
  - Node.js support
  - PostgreSQL installation allowed
  - Redis installation allowed
  - Custom configurations
  - Better performance

### 3. **Dedicated Server** (For Scale)
- **Price**: $129.99+/month
- **Benefits**:
  - Complete control
  - Best performance
  - Ideal for high traffic

## Recommended Hosting Setup

For Dreamer AI website, we recommend **VPS Hosting** with these specifications:
- **Plan**: VPS Economy or Standard
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 120GB SSD
- **Bandwidth**: Unlimited

### Setting Up VPS

1. **Purchase VPS from GoDaddy**:
   - Log into GoDaddy account
   - Navigate to Products > Servers > VPS
   - Select plan and Ubuntu 22.04
   - Complete purchase

2. **Initial VPS Setup**:
   ```bash
   # SSH into your VPS
   ssh root@YOUR_VPS_IP

   # Update system
   apt update && apt upgrade -y

   # Install essential packages
   apt install -y curl git nginx postgresql redis-server nodejs npm certbot python3-certbot-nginx

   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt install -y nodejs

   # Install PM2 for process management
   npm install -g pm2
   ```

## DNS Configuration

1. **Access GoDaddy DNS Management**:
   - Log into GoDaddy
   - Go to My Products > Domains
   - Click "DNS" next to dreamerai.io

2. **Configure A Records**:
   ```
   Type: A
   Name: @
   Value: YOUR_VPS_IP
   TTL: 1 Hour

   Type: A
   Name: www
   Value: YOUR_VPS_IP
   TTL: 1 Hour

   Type: A
   Name: api
   Value: YOUR_VPS_IP
   TTL: 1 Hour
   ```

3. **Wait for DNS Propagation** (5 minutes to 48 hours)

## Database Setup

### PostgreSQL Configuration

1. **Access PostgreSQL**:
   ```bash
   sudo -u postgres psql
   ```

2. **Create Database and User**:
   ```sql
   -- Create user
   CREATE USER dreameruser WITH PASSWORD 'YOUR_SECURE_PASSWORD';

   -- Create database
   CREATE DATABASE dreamerai_prod OWNER dreameruser;

   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE dreamerai_prod TO dreameruser;

   -- Exit
   \q
   ```

3. **Configure PostgreSQL for Remote Access** (if needed):
   ```bash
   # Edit postgresql.conf
   nano /etc/postgresql/14/main/postgresql.conf
   # Add: listen_addresses = 'localhost'

   # Edit pg_hba.conf
   nano /etc/postgresql/14/main/pg_hba.conf
   # Add: host all all 127.0.0.1/32 md5

   # Restart PostgreSQL
   systemctl restart postgresql
   ```

### Redis Configuration

1. **Secure Redis**:
   ```bash
   # Edit Redis config
   nano /etc/redis/redis.conf

   # Set password
   requirepass YOUR_REDIS_PASSWORD

   # Bind to localhost only
   bind 127.0.0.1

   # Restart Redis
   systemctl restart redis-server
   ```

## File Upload Methods

### Method 1: FTP (Simple but Slow)

1. **Get FTP Credentials**:
   - GoDaddy account > Hosting > Manage > Settings > FTP Users

2. **Using FileZilla**:
   - Host: Your VPS IP
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21

### Method 2: SSH/SCP (Recommended)

1. **Enable SSH**:
   ```bash
   # On VPS
   systemctl enable ssh
   systemctl start ssh
   ```

2. **Upload Files**:
   ```bash
   # From local machine
   scp -r ./backend root@YOUR_VPS_IP:/var/www/dreamerai/
   scp -r ./frontend/build root@YOUR_VPS_IP:/var/www/dreamerai/
   ```

### Method 3: Git (Best Practice)

1. **On VPS**:
   ```bash
   # Create deployment directory
   mkdir -p /var/www/dreamerai
   cd /var/www/dreamerai

   # Clone repository (if using Git)
   git clone YOUR_REPO_URL .
   ```

## Frontend Deployment

### Step 1: Build Frontend Locally

```bash
cd frontend

# Set production API URL
export REACT_APP_API_URL=https://api.dreamerai.io

# Build for production
npm run build
```

### Step 2: Upload Build Files

1. **Create directory on VPS**:
   ```bash
   mkdir -p /var/www/dreamerai/frontend
   ```

2. **Upload build folder**:
   ```bash
   # From local machine
   scp -r ./frontend/build/* root@YOUR_VPS_IP:/var/www/dreamerai/frontend/
   ```

### Step 3: Configure Nginx

1. **Create Nginx configuration**:
   ```bash
   nano /etc/nginx/sites-available/dreamerai
   ```

2. **Add configuration**:
   ```nginx
   server {
       listen 80;
       server_name dreamerai.io www.dreamerai.io;
       root /var/www/dreamerai/frontend;
       index index.html;

       # Frontend routes
       location / {
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api/ {
           proxy_pass http://localhost:3000/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Static files caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **Enable site**:
   ```bash
   ln -s /etc/nginx/sites-available/dreamerai /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

## Backend Deployment

### Step 1: Upload Backend Files

```bash
# Create backend directory
mkdir -p /var/www/dreamerai/backend

# Upload files (from local)
scp -r ./backend/* root@YOUR_VPS_IP:/var/www/dreamerai/backend/
```

### Step 2: Install Dependencies

```bash
cd /var/www/dreamerai/backend
npm install --production
```

### Step 3: Run Database Migrations

```bash
# Set environment variables
export DATABASE_URL="postgresql://dreameruser:YOUR_PASSWORD@localhost:5432/dreamerai_prod"

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### Step 4: Create PM2 Ecosystem File

```bash
nano /var/www/dreamerai/backend/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'dreamerai-backend',
    script: './server.js',
    instances: 2,
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

### Step 5: Start Backend with PM2

```bash
cd /var/www/dreamerai/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## SSL Certificate Setup

### Using Let's Encrypt (Free)

1. **Install Certbot**:
   ```bash
   apt install certbot python3-certbot-nginx
   ```

2. **Generate Certificate**:
   ```bash
   certbot --nginx -d dreamerai.io -d www.dreamerai.io -d api.dreamerai.io
   ```

3. **Auto-renewal**:
   ```bash
   # Test renewal
   certbot renew --dry-run

   # Add to crontab
   crontab -e
   # Add: 0 0 * * * certbot renew --quiet
   ```

### Using GoDaddy SSL (Paid)

1. **Purchase SSL from GoDaddy**
2. **Generate CSR on VPS**:
   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout dreamerai.key -out dreamerai.csr
   ```
3. **Submit CSR to GoDaddy**
4. **Install certificate files**

## Environment Variables

### Create Production Environment File

```bash
nano /var/www/dreamerai/backend/.env
```

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://dreameruser:YOUR_PASSWORD@localhost:5432/dreamerai_prod

# Redis
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@localhost:6379

# Security
JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET_MINIMUM_32_CHARS
SESSION_SECRET=YOUR_PRODUCTION_SESSION_SECRET

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email Configuration (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL
FRONTEND_URL=https://dreamerai.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Secure Environment File

```bash
chmod 600 /var/www/dreamerai/backend/.env
chown www-data:www-data /var/www/dreamerai/backend/.env
```

## Post-Deployment Checklist

1. **Test All Endpoints**:
   ```bash
   # Health check
   curl https://api.dreamerai.io/health

   # Frontend
   curl https://dreamerai.io
   ```

2. **Check SSL Certificate**:
   - Visit https://dreamerai.io
   - Verify padlock icon in browser

3. **Test Features**:
   - [ ] Homepage loads
   - [ ] ElevenLabs ConvAI widget works
   - [ ] HeyGen video plays
   - [ ] Contact form submits
   - [ ] API endpoints respond

4. **Monitor Logs**:
   ```bash
   # PM2 logs
   pm2 logs

   # Nginx logs
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

5. **Setup Monitoring**:
   ```bash
   # Install monitoring
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   ```

## Troubleshooting

### Common Issues and Solutions

1. **502 Bad Gateway**:
   - Check if backend is running: `pm2 status`
   - Check backend logs: `pm2 logs`
   - Verify port configuration

2. **Database Connection Error**:
   - Check PostgreSQL status: `systemctl status postgresql`
   - Verify credentials in .env
   - Check database exists: `sudo -u postgres psql -l`

3. **SSL Certificate Issues**:
   - Renew certificate: `certbot renew`
   - Check Nginx config: `nginx -t`

4. **Slow Performance**:
   - Check server resources: `htop`
   - Enable Nginx caching
   - Consider upgrading VPS plan

5. **CORS Errors**:
   - Verify backend CORS configuration
   - Check API URL in frontend build

### Support Resources

- **GoDaddy Support**: 1-480-505-8877
- **GoDaddy Help Center**: https://www.godaddy.com/help
- **Community Forums**: https://www.godaddy.com/community

## Maintenance Tasks

### Weekly
- Check server resources
- Review error logs
- Update dependencies (test first)

### Monthly
- SSL certificate check
- Database backup
- Security updates

### Backup Script

Create automated backup:
```bash
nano /root/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U dreameruser dreamerai_prod > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/dreamerai/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
chmod +x /root/backup.sh
crontab -e
# Add: 0 2 * * * /root/backup.sh
```

## Conclusion

Your Dreamer AI website should now be live at https://dreamerai.io! Remember to:
- Monitor the application regularly
- Keep dependencies updated
- Maintain regular backups
- Review security best practices

For additional support, contact GoDaddy's technical support team with your specific VPS details.