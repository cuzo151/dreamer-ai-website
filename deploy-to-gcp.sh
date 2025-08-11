#!/bin/bash

# Dreamer AI Website - Google Cloud Deployment Script
# Project: dreamer-ai-website
# Account: tekniquesmr@gmail.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="dreamer-ai-website"
REGION="us-central1"
FRONTEND_SERVICE="dreamer-frontend"
BACKEND_SERVICE="dreamer-backend"

echo -e "${BLUE}🚀 Dreamer AI Website - Google Cloud Deployment${NC}"
echo -e "${YELLOW}Project: $PROJECT_ID${NC}"
echo ""

# Step 1: Authenticate with Google Cloud
echo -e "${GREEN}Step 1: Authenticating with Google Cloud${NC}"
echo -e "${YELLOW}Please make sure you're logged in with tekniquesmr@gmail.com${NC}"
gcloud auth login

# Set the project
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo -e "${GREEN}Step 2: Enabling required Google Cloud APIs${NC}"
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    redis.googleapis.com \
    compute.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# Step 3: Create Artifact Registry for Docker images
echo -e "${GREEN}Step 3: Creating Artifact Registry${NC}"
gcloud artifacts repositories create dreamer-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Dreamer AI Docker images" || echo "Repository already exists"

# Configure Docker authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Step 4: Build and push Docker images
echo -e "${GREEN}Step 4: Building Docker images${NC}"

# Build frontend
echo -e "${BLUE}Building frontend...${NC}"
cd frontend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${FRONTEND_SERVICE}:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${FRONTEND_SERVICE}:latest
cd ..

# Build backend
echo -e "${BLUE}Building backend...${NC}"
cd backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${BACKEND_SERVICE}:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${BACKEND_SERVICE}:latest
cd ..

# Step 5: Create Cloud SQL instance
echo -e "${GREEN}Step 5: Setting up Cloud SQL (PostgreSQL)${NC}"
gcloud sql instances create dreamer-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --network=default \
    --no-assign-ip || echo "Database already exists"

# Create database
gcloud sql databases create dreamerai_db --instance=dreamer-db || echo "Database already exists"

# Create user
gcloud sql users create dreamerai \
    --instance=dreamer-db \
    --password=dreamerai123 || echo "User already exists"

# Step 6: Create Redis instance
echo -e "${GREEN}Step 6: Setting up Redis (Memorystore)${NC}"
gcloud redis instances create dreamer-redis \
    --size=1 \
    --region=$REGION \
    --redis-version=redis_6_x || echo "Redis instance already exists"

# Get Redis host
REDIS_HOST=$(gcloud redis instances describe dreamer-redis --region=$REGION --format="get(host)")

# Step 7: Store secrets in Secret Manager
echo -e "${GREEN}Step 7: Configuring Secret Manager${NC}"

# Create secrets
echo -n "your-jwt-secret-here" | gcloud secrets create jwt-secret --data-file=- || echo "Secret already exists"
echo -n "your-session-secret-here" | gcloud secrets create session-secret --data-file=- || echo "Secret already exists"

# Step 8: Deploy Backend to Cloud Run
echo -e "${GREEN}Step 8: Deploying Backend to Cloud Run${NC}"
gcloud run deploy $BACKEND_SERVICE \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${BACKEND_SERVICE}:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="DATABASE_URL=postgresql://dreamerai:dreamerai123@/dreamerai_db?host=/cloudsql/${PROJECT_ID}:${REGION}:dreamer-db" \
    --set-env-vars="REDIS_HOST=$REDIS_HOST" \
    --set-env-vars="REDIS_PORT=6379" \
    --set-secrets="JWT_SECRET=jwt-secret:latest" \
    --set-secrets="SESSION_SECRET=session-secret:latest" \
    --add-cloudsql-instances=${PROJECT_ID}:${REGION}:dreamer-db \
    --vpc-connector=projects/${PROJECT_ID}/locations/${REGION}/connectors/vpc-connector \
    --min-instances=0 \
    --max-instances=10 \
    --memory=512Mi

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="get(status.url)")

# Step 9: Deploy Frontend to Cloud Run
echo -e "${GREEN}Step 9: Deploying Frontend to Cloud Run${NC}"
gcloud run deploy $FRONTEND_SERVICE \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${FRONTEND_SERVICE}:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="REACT_APP_API_URL=$BACKEND_URL/api" \
    --min-instances=0 \
    --max-instances=10 \
    --memory=256Mi

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="get(status.url)")

# Step 10: Set up Load Balancer with custom domain
echo -e "${GREEN}Step 10: Setting up Load Balancer for dreamerai.io${NC}"

# Reserve static IP
gcloud compute addresses create dreamer-ip --global || echo "IP already reserved"
STATIC_IP=$(gcloud compute addresses describe dreamer-ip --global --format="get(address)")

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Your services are available at:${NC}"
echo -e "Frontend: $FRONTEND_URL"
echo -e "Backend: $BACKEND_URL"
echo ""
echo -e "${YELLOW}📌 Next Steps:${NC}"
echo -e "1. Update your GoDaddy DNS to point to: ${GREEN}$STATIC_IP${NC}"
echo -e "   - A Record: @ → $STATIC_IP"
echo -e "   - CNAME: www → @"
echo ""
echo -e "2. Run the load balancer setup:"
echo -e "   ${GREEN}./setup-gcp-loadbalancer.sh${NC}"
echo ""
echo -e "3. Your site will be available at:"
echo -e "   ${GREEN}https://dreamerai.io${NC}"