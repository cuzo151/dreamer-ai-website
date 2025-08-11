# Dreamer AI Solutions - Development Deployment Guide

This guide provides comprehensive instructions for deploying the Dreamer AI Solutions website in a development environment with full monitoring, SSL/TLS support, and management tools.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Detailed Setup](#detailed-setup)
- [Service Access Points](#service-access-points)
- [Management Commands](#management-commands)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)

## Prerequisites

### Required Software

- **Docker Desktop** (includes Docker and Docker Compose)
  - macOS: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Windows: Requires WSL2
  - Linux: Install Docker Engine and Docker Compose separately

- **Node.js 18+** (for local development)
- **Git** (for version control)
- **OpenSSL** (for certificate generation)

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: At least 10GB free
- **CPU**: 4+ cores recommended

## Quick Start

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd dreamer-ai-website
```

### 2. Run Quick Start Script

```bash
./scripts/deploy/quick-start.sh
```

This script will:
- Check prerequisites
- Generate SSL certificates
- Create configuration files
- Start all services with monitoring
- Display access URLs

### 3. Update Hosts File

Add these entries to `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 dreamer.local
127.0.0.1 api.dreamer.local
127.0.0.1 traefik.dreamer.local
127.0.0.1 prometheus.dreamer.local
127.0.0.1 grafana.dreamer.local
127.0.0.1 jaeger.dreamer.local
127.0.0.1 pgadmin.dreamer.local
127.0.0.1 redis.dreamer.local
127.0.0.1 mail.dreamer.local
127.0.0.1 portainer.dreamer.local
```

### 4. Import Root CA Certificate

To avoid SSL warnings:

1. **macOS**: 
   ```bash
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/rootCA.crt
   ```

2. **Windows**: Double-click `certs/rootCA.crt` and install to "Trusted Root Certification Authorities"

3. **Linux**: 
   ```bash
   sudo cp certs/rootCA.crt /usr/local/share/ca-certificates/
   sudo update-ca-certificates
   ```

### 5. Update Environment Variables

Edit `.env` file with your API keys:
```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Architecture Overview

### Services Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Traefik (Reverse Proxy)              │
│                     SSL/TLS Termination & Routing           │
└─────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
┌───────▼────────┐                              ┌────────▼────────┐
│    Frontend    │                              │    Backend API   │
│  (React + TS)  │                              │  (Node + Express)│
└────────────────┘                              └─────────────────┘
                                                         │
                                    ┌────────────────────┴────────────────┐
                                    │                                     │
                           ┌────────▼────────┐                  ┌────────▼────────┐
                           │   PostgreSQL    │                  │      Redis       │
                           │   (Database)    │                  │     (Cache)      │
                           └─────────────────┘                  └─────────────────┘

                              Monitoring Stack
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Prometheus  │    │   Grafana   │    │   Jaeger    │    │  Portainer  │
│  (Metrics)  │    │ (Dashboards)│    │  (Tracing)  │    │ (Container) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Network Architecture

- All services run on a custom Docker network (`dreamer-network`)
- Traefik handles SSL/TLS termination and routing
- Internal services communicate using Docker DNS
- External access through mapped ports

## Detailed Setup

### Manual Setup Steps

#### 1. Generate SSL Certificates

```bash
cd scripts/deploy
./generate-certs.sh
```

#### 2. Create Environment Configuration

```bash
cp .env.development .env
# Edit .env with your configuration
```

#### 3. Start Services

```bash
# Basic services only
./scripts/deploy/dev-deploy.sh start

# With management tools
./scripts/deploy/dev-deploy.sh -p tools start

# Full stack with monitoring
./scripts/deploy/dev-deploy.sh -p monitoring start
```

### Database Setup

The database is automatically initialized with:
- Schema creation (`schema.sql`)
- Index creation (`indices.sql`)
- Development seed data (`seed-dev.sql`)

Test credentials:
- Admin: `admin@dreamer-ai.com` / `TestPassword123!`
- Users: `john.doe@example.com` / `TestPassword123!`

## Service Access Points

### Application Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | https://dreamer.local | - |
| Backend API | https://api.dreamer.local | - |
| API Health | https://api.dreamer.local/health | - |
| API Docs | https://api.dreamer.local/api/docs | - |

### Infrastructure Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Traefik Dashboard | https://traefik.dreamer.local | admin/admin |
| PostgreSQL | localhost:5432 | dreamer/dreamerpass |
| Redis | localhost:6379 | Password: redispass |

### Management Tools

| Service | URL | Credentials |
|---------|-----|-------------|
| pgAdmin | https://pgadmin.dreamer.local | admin@dreamer-ai.com/admin |
| Redis Commander | https://redis.dreamer.local | admin/admin |
| Mailhog | https://mail.dreamer.local | - |
| Portainer | https://portainer.dreamer.local | Set on first login |

### Monitoring Tools

| Service | URL | Credentials |
|---------|-----|-------------|
| Prometheus | https://prometheus.dreamer.local | - |
| Grafana | https://grafana.dreamer.local | admin/admin |
| Jaeger | https://jaeger.dreamer.local | - |

## Management Commands

### Deployment Script Usage

```bash
# Show help
./scripts/deploy/dev-deploy.sh --help

# Start services
./scripts/deploy/dev-deploy.sh start

# Stop services
./scripts/deploy/dev-deploy.sh stop

# Restart services
./scripts/deploy/dev-deploy.sh restart

# Check status
./scripts/deploy/dev-deploy.sh status

# View logs
./scripts/deploy/dev-deploy.sh logs
./scripts/deploy/dev-deploy.sh logs -f backend  # Follow specific service

# Clean environment (remove volumes)
./scripts/deploy/dev-deploy.sh clean

# Complete reset
./scripts/deploy/dev-deploy.sh reset
```

### Docker Compose Commands

```bash
# View running containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Execute commands in containers
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed

# View container logs
docker-compose logs -f backend
docker-compose logs --tail=100 frontend

# Restart specific service
docker-compose restart backend
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U dreamer -d dreamerai_dev

# Run migrations
docker-compose exec backend npm run db:migrate

# Seed database
docker-compose exec backend npm run db:seed

# Backup database
docker-compose exec postgres pg_dump -U dreamer dreamerai_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U dreamer dreamerai_dev < backup.sql
```

## Monitoring and Debugging

### Health Checks

1. **System Health**: https://api.dreamer.local/health
2. **Detailed Health**: https://api.dreamer.local/health/detailed
3. **Readiness**: https://api.dreamer.local/health/ready
4. **Liveness**: https://api.dreamer.local/health/live

### Grafana Dashboards

1. **System Overview**: Monitor all services
2. **Backend Dashboard**: API-specific metrics
3. **PostgreSQL Dashboard**: Database performance
4. **Redis Dashboard**: Cache performance

### Prometheus Metrics

- Backend metrics: https://api.dreamer.local/health/metrics
- Traefik metrics: https://traefik.dreamer.local:8080/metrics

### Distributed Tracing

Access Jaeger UI at https://jaeger.dreamer.local to:
- View request traces
- Analyze performance bottlenecks
- Debug distributed transactions

### Log Management

```bash
# View all logs
./scripts/deploy/dev-deploy.sh logs -f

# View specific service logs
docker-compose logs -f backend

# Export logs
docker-compose logs > deployment.log

# Log locations inside containers
# Backend: /app/logs/
# PostgreSQL: /var/lib/postgresql/data/pg_log/
```

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

```bash
# Check Docker status
docker info

# Check port conflicts
lsof -i :3000  # Backend
lsof -i :3001  # Frontend
lsof -i :5432  # PostgreSQL

# Clean restart
./scripts/deploy/dev-deploy.sh clean
./scripts/deploy/dev-deploy.sh start
```

#### 2. SSL Certificate Issues

```bash
# Regenerate certificates
rm -rf certs/*
cd scripts/deploy
./generate-certs.sh

# Restart services
./scripts/deploy/dev-deploy.sh restart
```

#### 3. Database Connection Issues

```bash
# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres

# Reset database
docker-compose exec postgres psql -U dreamer -c "DROP DATABASE dreamerai_dev;"
docker-compose exec postgres psql -U dreamer -c "CREATE DATABASE dreamerai_dev;"
docker-compose exec backend npm run db:migrate
```

#### 4. Memory Issues

```bash
# Check container resources
docker stats

# Increase Docker memory allocation
# Docker Desktop > Preferences > Resources

# Reduce service replicas in docker-compose.yml
```

### Debug Mode

Enable debug mode by setting in `.env`:
```
DEBUG=true
LOG_LEVEL=debug
```

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes in `/frontend/src` auto-refresh
- Backend: Nodemon restarts on file changes

### Making Changes

1. **Frontend Development**
   ```bash
   # Frontend runs on https://dreamer.local
   # Edit files in frontend/src/
   # Changes auto-reload
   ```

2. **Backend Development**
   ```bash
   # Backend runs on https://api.dreamer.local
   # Edit files in backend/
   # Server auto-restarts
   ```

3. **Database Changes**
   ```bash
   # Add migration files to backend/database/migrations/
   # Run: docker-compose exec backend npm run db:migrate
   ```

### Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test

# Run E2E tests
npm run test:e2e
```

### Git Workflow

```bash
# Check changes
git status

# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature
```

## Security Considerations

### Development Security

- All services use HTTPS with self-signed certificates
- Secrets stored in `.env` (never commit this file)
- Network isolation between services
- Non-root containers
- Security headers enabled

### Production Preparation

Before deploying to production:
1. Replace self-signed certificates with valid SSL certificates
2. Update all passwords and secrets
3. Disable debug mode
4. Configure proper backup strategies
5. Set up monitoring alerts
6. Review security configurations

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review service logs
3. Check health endpoints
4. Contact the development team

---

Last Updated: January 2025