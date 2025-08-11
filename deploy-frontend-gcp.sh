#!/bin/bash

# Deploy Frontend to Google Cloud Run
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="dreamer-ai-website"
REGION="us-central1"
SERVICE_NAME="dreamer-frontend"
BACKEND_URL="https://dreamer-backend-744592276601.us-central1.run.app"

echo -e "${BLUE}🚀 Deploying Frontend to Google Cloud Run${NC}"
echo ""

# Step 1: Prepare frontend
echo -e "${GREEN}Step 1: Preparing frontend...${NC}"
cd frontend

# Set backend URL
echo "REACT_APP_API_URL=$BACKEND_URL/api" > .env.production.local

# Step 2: Build React app
echo -e "${GREEN}Step 2: Building React app...${NC}"
npm install
npm run build

# Step 3: Build Docker image for linux/amd64
echo -e "${GREEN}Step 3: Building Docker image...${NC}"
docker buildx build \
    --platform linux/amd64 \
    -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${SERVICE_NAME}:latest \
    --push .

# Step 4: Deploy to Cloud Run
echo -e "${GREEN}Step 4: Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${SERVICE_NAME}:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=100 \
    --timeout=300

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

cd ..

echo ""
echo -e "${GREEN}✅ Frontend Deployed Successfully!${NC}"
echo ""
echo -e "${BLUE}Your website is now live at:${NC}"
echo -e "${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}Backend API:${NC} $BACKEND_URL"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Test your site: ${GREEN}$FRONTEND_URL${NC}"
echo -e "2. Set up custom domain (dreamerai.io) with Load Balancer"
echo -e "3. Run: ${GREEN}./setup-custom-domain.sh${NC}"