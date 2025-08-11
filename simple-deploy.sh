#!/bin/bash

# Simple deployment script for Dreamer AI to Google Cloud
# This version uses Cloud Run with buildpacks (no Docker needed)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="dreamer-ai-website"
REGION="us-central1"

echo -e "${BLUE}🚀 Simple Deployment for Dreamer AI${NC}"
echo ""

# Step 1: Check billing
echo -e "${GREEN}Step 1: Checking billing status...${NC}"
BILLING_ENABLED=$(gcloud beta billing projects describe $PROJECT_ID --format="value(billingEnabled)" 2>/dev/null || echo "false")

if [ "$BILLING_ENABLED" != "True" ]; then
    echo -e "${RED}❌ Billing is not enabled${NC}"
    echo -e "${YELLOW}Please enable billing first:${NC}"
    echo -e "${BLUE}https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Billing is enabled${NC}"

# Step 2: Enable minimal APIs
echo -e "${GREEN}Step 2: Enabling Cloud Run API...${NC}"
gcloud services enable run.googleapis.com

# Step 3: Build and deploy backend
echo -e "${GREEN}Step 3: Deploying Backend...${NC}"
cd backend

# Create a simple start script
cat > start.sh << 'EOF'
#!/bin/bash
npm start
EOF
chmod +x start.sh

# Deploy using buildpacks
gcloud run deploy dreamer-backend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --memory=512Mi \
    --min-instances=0 \
    --max-instances=10

# Get backend URL
BACKEND_URL=$(gcloud run services describe dreamer-backend --region=$REGION --format="value(status.url)")
echo -e "${GREEN}Backend deployed at: $BACKEND_URL${NC}"

cd ..

# Step 4: Build frontend with API URL
echo -e "${GREEN}Step 4: Building Frontend...${NC}"
cd frontend

# Update environment
echo "REACT_APP_API_URL=$BACKEND_URL/api" > .env.production

# Build
npm run build

# Create simple server for React
cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
EOF

# Create package.json for Cloud Run
cat > package-serve.json << EOF
{
  "name": "dreamer-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# Deploy frontend
gcloud run deploy dreamer-frontend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory=256Mi \
    --min-instances=0 \
    --max-instances=10

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe dreamer-frontend --region=$REGION --format="value(status.url)")

cd ..

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Your services are live at:${NC}"
echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "Backend: ${GREEN}$BACKEND_URL${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Test your site at: $FRONTEND_URL"
echo -e "2. Set up custom domain (dreamerai.io)"
echo -e "3. Configure database (optional for now)"
echo ""
echo -e "${GREEN}To set up custom domain, run:${NC}"
echo -e "./setup-custom-domain.sh"