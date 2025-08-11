#!/bin/bash

# Dreamer AI Solutions - Development Environment Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Dreamer AI Solutions development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisite() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "Please install $1 and try again"
        exit 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
    fi
}

echo "Checking prerequisites..."
check_prerequisite "node"
check_prerequisite "npm"
check_prerequisite "docker"
check_prerequisite "docker-compose"
check_prerequisite "git"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env <<EOF
# Environment
NODE_ENV=development

# API Keys (replace with your own)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Database
DATABASE_URL=postgresql://dreamer:dreamerpass@localhost:5432/dreamerai_dev

# Redis
REDIS_URL=redis://:redispass@localhost:6379

# JWT
JWT_SECRET=development-secret-change-in-production

# AWS (for production)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
EOF
    echo -e "${YELLOW}⚠️  Please update .env file with your API keys${NC}"
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci
cd ..

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
cd backend
npm run migrate || echo "Migration skipped or already applied"
cd ..

# Verify setup
echo -e "\n${GREEN}🎉 Development environment setup complete!${NC}"
echo -e "\nTo start the development servers:"
echo -e "  ${YELLOW}docker-compose up${NC} - Start all services"
echo -e "  ${YELLOW}npm run dev${NC} - Start frontend and backend in development mode"
echo -e "\nUseful commands:"
echo -e "  ${YELLOW}docker-compose ps${NC} - Check service status"
echo -e "  ${YELLOW}docker-compose logs -f${NC} - View logs"
echo -e "  ${YELLOW}docker-compose down${NC} - Stop all services"
echo -e "\nAccess points:"
echo -e "  Frontend: ${GREEN}http://localhost:3001${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3000${NC}"
echo -e "  PostgreSQL: ${GREEN}localhost:5432${NC}"
echo -e "  Redis: ${GREEN}localhost:6379${NC}"
echo -e "\nOptional tools (run with --profile tools):"
echo -e "  pgAdmin: ${GREEN}http://localhost:5050${NC}"
echo -e "  Redis Commander: ${GREEN}http://localhost:8081${NC}"