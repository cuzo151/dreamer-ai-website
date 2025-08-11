#!/bin/bash

# Quick Google Cloud Setup for Dreamer AI Website
# This script helps you authenticate and prepare for deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Dreamer AI - Quick Google Cloud Setup${NC}"
echo ""

# Step 1: Login to Google Cloud
echo -e "${GREEN}Step 1: Login to Google Cloud${NC}"
echo -e "${YELLOW}Please use your tekniquesmr@gmail.com account${NC}"
echo ""
gcloud auth login

# Step 2: Set project
echo -e "${GREEN}Step 2: Setting project to dreamer-ai-website${NC}"
gcloud config set project dreamer-ai-website

# Step 3: Set application default credentials
echo -e "${GREEN}Step 3: Setting application default credentials${NC}"
gcloud auth application-default login

# Step 4: Verify setup
echo -e "${GREEN}Step 4: Verifying setup${NC}"
echo -e "Current project: ${YELLOW}$(gcloud config get-value project)${NC}"
echo -e "Current account: ${YELLOW}$(gcloud config get-value account)${NC}"

# Step 5: Enable basic APIs
echo -e "${GREEN}Step 5: Enabling essential APIs${NC}"
gcloud services enable \
    cloudresourcemanager.googleapis.com \
    compute.googleapis.com \
    run.googleapis.com

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update the .env.production file with your API keys"
echo -e "2. Run: ${GREEN}./deploy-to-gcp.sh${NC}"
echo ""