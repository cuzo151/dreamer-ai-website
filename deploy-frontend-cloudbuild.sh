#!/bin/bash

# Deploy Frontend to Google Cloud Run using Cloud Build
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

echo -e "${BLUE}🚀 Deploying Frontend to Google Cloud Run (Cloud Build)${NC}"
echo ""

# Step 1: Prepare frontend
echo -e "${GREEN}Step 1: Preparing frontend...${NC}"
cd frontend

# Frontend is already built from previous step
if [ ! -d "build" ]; then
    echo -e "${YELLOW}Building React app...${NC}"
    npm install
    npm run build
fi

# Create .gcloudignore
cat > .gcloudignore << EOF
node_modules/
src/
public/
coverage/
.env
.env.local
.env.development
*.log
.git/
.gitignore
README.md
*.test.*
*.spec.*
EOF

# Step 2: Submit to Cloud Build
echo -e "${GREEN}Step 2: Submitting to Cloud Build...${NC}"
gcloud builds submit \
    --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/${SERVICE_NAME}:latest \
    --timeout=20m

# Step 3: Deploy to Cloud Run
echo -e "${GREEN}Step 3: Deploying to Cloud Run...${NC}"
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
echo -e "2. Set up custom domain (dreamerai.io)"