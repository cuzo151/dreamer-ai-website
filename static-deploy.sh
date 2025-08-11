#!/bin/bash

# Static Deployment Options for Dreamer AI
# Works without Google Cloud billing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Static Deployment Options for Dreamer AI${NC}"
echo ""
echo -e "${YELLOW}Since Google Cloud billing is pending, here are alternative deployment options:${NC}"
echo ""

# Build the frontend first
echo -e "${GREEN}Building your frontend...${NC}"
cd frontend
npm run build
cd ..

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""

echo -e "${BLUE}Option 1: Deploy to Netlify (Recommended - Free)${NC}"
echo -e "${GREEN}Steps:${NC}"
echo "1. Go to: https://app.netlify.com"
echo "2. Drag and drop the 'frontend/build' folder"
echo "3. Your site will be live in seconds!"
echo "4. Set custom domain to dreamerai.io in Netlify settings"
echo ""

echo -e "${BLUE}Option 2: Deploy to Vercel (Free)${NC}"
echo -e "${GREEN}Steps:${NC}"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Run: cd frontend && vercel --prod"
echo "3. Follow the prompts"
echo "4. Add custom domain in Vercel dashboard"
echo ""

echo -e "${BLUE}Option 3: Deploy to GitHub Pages (Free)${NC}"
echo -e "${GREEN}Steps:${NC}"
echo "1. Create a GitHub repository"
echo "2. Push your code"
echo "3. Go to Settings → Pages"
echo "4. Deploy from 'gh-pages' branch"
echo ""

echo -e "${BLUE}Option 4: Deploy Backend Separately${NC}"
echo -e "${GREEN}For the backend API, you can use:${NC}"
echo "- Heroku (free tier available)"
echo "- Railway.app ($5/month)"
echo "- Render.com (free tier)"
echo ""

echo -e "${YELLOW}Quick Netlify Deploy:${NC}"
echo -e "${GREEN}Your build folder is ready at: ${BLUE}frontend/build${NC}"
echo -e "${GREEN}Just drag this folder to netlify.com!${NC}"
echo ""

# Create a simple deployment info file
cat > DEPLOYMENT_OPTIONS.md << EOF
# Deployment Options for Dreamer AI

## Frontend Deployment (Choose One)

### 1. Netlify (Recommended)
- Visit: https://app.netlify.com
- Drag 'frontend/build' folder to deploy
- Free SSL and custom domain support

### 2. Vercel
\`\`\`bash
cd frontend
npx vercel --prod
\`\`\`

### 3. GitHub Pages
\`\`\`bash
npm install -g gh-pages
npm run deploy
\`\`\`

## Backend Deployment Options

### 1. Railway.app
- Connect GitHub repo
- Auto-deploys on push
- $5/month

### 2. Render.com
- Free tier available
- Connect GitHub repo
- Automatic SSL

### 3. Heroku
- Free tier (limited hours)
- Easy deployment

## Custom Domain Setup

After deploying, add these DNS records at GoDaddy:
- A Record: @ → [Platform's IP]
- CNAME: www → [Platform's domain]

Each platform will provide specific DNS instructions.
EOF

echo -e "${GREEN}Created DEPLOYMENT_OPTIONS.md with detailed instructions!${NC}"