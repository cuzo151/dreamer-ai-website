#!/bin/bash

# Simple frontend deployment using Cloud Run source deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGION="us-central1"
BACKEND_URL="https://dreamer-backend-744592276601.us-central1.run.app"

echo -e "${BLUE}Deploying Frontend to Cloud Run (Simple Method)${NC}"

cd frontend

# Update environment
echo "REACT_APP_API_URL=$BACKEND_URL/api" > .env.production.local

# Build
echo -e "${GREEN}Building frontend...${NC}"
npm run build

# Create a simple Express server
cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
EOF

# Create package.json for production
cat > package.json << EOF
{
  "name": "dreamer-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create .gcloudignore
cat > .gcloudignore << EOF
node_modules/
src/
public/
.env
.env.local
.env.development
*.log
.git/
.gitignore
README.md
tsconfig.json
tailwind.config.js
postcss.config.js
EOF

# Deploy using source deployment
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy dreamer-frontend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10

# Get URL
FRONTEND_URL=$(gcloud run services describe dreamer-frontend --region=$REGION --format="value(status.url)")

cd ..

echo ""
echo -e "${GREEN}✅ Frontend Deployed Successfully!${NC}"
echo ""
echo -e "${BLUE}Your website is live at:${NC}"
echo -e "${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}Backend API:${NC} $BACKEND_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Test your site at: $FRONTEND_URL"
echo -e "2. Set up custom domain (dreamerai.io)"