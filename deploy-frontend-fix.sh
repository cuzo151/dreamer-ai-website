#!/bin/bash

# Quick deployment script for frontend fixes
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Frontend Fixes to dreamerai.io${NC}"
echo ""

# Configuration
PROJECT_ID="dreamer-ai-website"
REGION="us-central1"
SERVICE_NAME="dreamer-frontend"

# Step 1: Ensure we're in frontend directory
cd frontend

# Step 2: Submit build using gcloud run deploy with source
echo -e "${GREEN}Deploying directly from source...${NC}"
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory=512Mi \
    --cpu=1

# Get the URL
FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}Your updated site is at:${NC} ${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}Note: The domain dreamerai.io should automatically point to this updated service.${NC}"