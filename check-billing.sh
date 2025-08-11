#!/bin/bash

# Check Google Cloud billing status

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking Google Cloud Billing Status${NC}"
echo ""

# Check current project
echo -e "${GREEN}Current Configuration:${NC}"
echo -e "Project: ${YELLOW}$(gcloud config get-value project)${NC}"
echo -e "Account: ${YELLOW}$(gcloud config get-value account)${NC}"
echo ""

# Check billing account
echo -e "${GREEN}Checking billing account...${NC}"
BILLING_ENABLED=$(gcloud beta billing projects describe dreamer-ai-website --format="value(billingEnabled)" 2>/dev/null || echo "false")

if [ "$BILLING_ENABLED" = "True" ]; then
    echo -e "${GREEN}✅ Billing is enabled!${NC}"
    BILLING_ACCOUNT=$(gcloud beta billing projects describe dreamer-ai-website --format="value(billingAccountName)")
    echo -e "Billing Account: ${YELLOW}${BILLING_ACCOUNT}${NC}"
else
    echo -e "${RED}❌ Billing is not enabled${NC}"
    echo ""
    echo -e "${YELLOW}To enable billing:${NC}"
    echo -e "1. Go to: ${BLUE}https://console.cloud.google.com/billing/projects${NC}"
    echo -e "2. Find 'dreamer-ai-website' project"
    echo -e "3. Click 'Actions' → 'Change billing'"
    echo -e "4. Select your billing account"
    echo ""
    echo -e "${YELLOW}Or use this direct link:${NC}"
    echo -e "${BLUE}https://console.cloud.google.com/billing/linkedaccount?project=dreamer-ai-website${NC}"
fi

echo ""
echo -e "${GREEN}Checking available APIs...${NC}"
gcloud services list --enabled --format="table(NAME)" 2>/dev/null | head -10 || echo "Unable to list services"

echo ""
echo -e "${YELLOW}Note:${NC} If billing was just enabled, it may take 1-2 minutes to propagate."