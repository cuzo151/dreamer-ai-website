#!/bin/bash

# Deploy to Google Cloud Run - Quick Version
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="dreamer-ai-website"
REGION="us-central1"

echo -e "${BLUE}🚀 Deploying Dreamer AI to Google Cloud Run${NC}"
echo ""

# Enable remaining APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com

# Create Artifact Registry
echo -e "${GREEN}Creating Artifact Registry...${NC}"
gcloud artifacts repositories create dreamer-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Dreamer AI Docker images" 2>/dev/null || echo "Repository exists"

# Configure Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Deploy Backend
echo -e "${GREEN}Deploying Backend...${NC}"
cd backend

# Create Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
EOF
fi

# Build and push
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/dreamer-backend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/dreamer-backend:latest

# Deploy to Cloud Run
gcloud run deploy dreamer-backend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/dreamer-backend:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 3000 \
    --set-env-vars="NODE_ENV=production" \
    --memory=512Mi

BACKEND_URL=$(gcloud run services describe dreamer-backend --region=$REGION --format="value(status.url)")
echo -e "${GREEN}Backend deployed at: $BACKEND_URL${NC}"

cd ..

# Deploy Frontend
echo -e "${GREEN}Deploying Frontend...${NC}"
cd frontend

# Update API URL
echo "REACT_APP_API_URL=$BACKEND_URL/api" > .env.production.local

# Build
npm run build

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx config
cat > nginx.conf << 'EOF'
server {
    listen 8080;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Build and push
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/dreamer-frontend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/dreamer-frontend:latest

# Deploy to Cloud Run
gcloud run deploy dreamer-frontend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/dreamer-repo/dreamer-frontend:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory=256Mi

FRONTEND_URL=$(gcloud run services describe dreamer-frontend --region=$REGION --format="value(status.url)")

cd ..

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Your services are live at:${NC}"
echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "Backend: ${GREEN}$BACKEND_URL${NC}"
echo ""
echo -e "${YELLOW}Test your site at: $FRONTEND_URL${NC}"