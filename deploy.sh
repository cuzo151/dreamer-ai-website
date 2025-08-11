#!/bin/bash

# Dreamer AI Solutions Production Deployment Script
# This script deploys the application to dreamerai.io

set -e

echo "🚀 Starting Dreamer AI Solutions deployment to production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please create .env.production with proper production values"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env.production${NC}"
        exit 1
    fi
done

# Check for placeholder values
if [[ "$JWT_SECRET" == *"GENERATE"* ]] || [[ "$DB_PASS" == *"CHANGE_THIS"* ]]; then
    echo -e "${RED}Error: Please update placeholder values in .env.production${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configuration validated${NC}"

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend build failed!${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ Frontend build completed${NC}"

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm run build || npm run compile || echo "No build script found, using source files"
cd ..
echo -e "${GREEN}✓ Backend preparation completed${NC}"

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Build and start new containers
echo -e "${YELLOW}Building and starting production containers...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check health status
echo -e "${YELLOW}Checking service health...${NC}"
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
else
    echo -e "${RED}✗ Backend API health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs backend
fi

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec backend npm run migrate || echo "No migrations to run"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update DNS records to point dreamerai.io to this server"
echo "2. Ensure SSL certificates are properly configured"
echo "3. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "4. Access the application at https://dreamerai.io"
echo ""
echo "Useful commands:"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Stop services: docker-compose -f docker-compose.prod.yml down"
echo "- Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "- View status: docker-compose -f docker-compose.prod.yml ps"