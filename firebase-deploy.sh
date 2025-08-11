#!/bin/bash

# Firebase Deployment for Dreamer AI
# Alternative deployment method that's often easier to set up

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔥 Firebase Deployment for Dreamer AI${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Installing Firebase CLI...${NC}"
    npm install -g firebase-tools
fi

# Step 1: Login to Firebase
echo -e "${GREEN}Step 1: Login to Firebase${NC}"
firebase login

# Step 2: Initialize Firebase
echo -e "${GREEN}Step 2: Initialize Firebase Project${NC}"
if [ ! -f "firebase.json" ]; then
    firebase init hosting
fi

# Step 3: Build the frontend
echo -e "${GREEN}Step 3: Building Frontend...${NC}"
cd frontend
npm run build
cd ..

# Step 4: Configure Firebase hosting
echo -e "${GREEN}Step 4: Configuring Firebase...${NC}"
cat > firebase.json << EOF
{
  "hosting": {
    "public": "frontend/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(eot|otf|ttf|ttc|woff|font.css)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          }
        ]
      }
    ]
  }
}
EOF

# Step 5: Deploy
echo -e "${GREEN}Step 5: Deploying to Firebase...${NC}"
firebase deploy --only hosting

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}Your site is now live at:${NC}"
firebase hosting:channel:deploy preview
echo ""
echo -e "${YELLOW}To set up custom domain (dreamerai.io):${NC}"
echo -e "1. Go to Firebase Console → Hosting → Add custom domain"
echo -e "2. Follow the DNS verification steps"
echo ""