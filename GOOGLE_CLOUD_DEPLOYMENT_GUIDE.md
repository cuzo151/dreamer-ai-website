# Google Cloud Platform Deployment Guide for Dreamer AI Website

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Initial Setup](#initial-setup)
4. [Cloud SQL Setup](#cloud-sql-setup)
5. [Redis Setup with Memorystore](#redis-setup-with-memorystore)
6. [Container Registry Setup](#container-registry-setup)
7. [Cloud Run Deployment](#cloud-run-deployment)
8. [Load Balancer & SSL Configuration](#load-balancer--ssl-configuration)
9. [DNS Configuration](#dns-configuration)
10. [CI/CD with Cloud Build](#cicd-with-cloud-build)
11. [Cost Optimization](#cost-optimization)
12. [Monitoring & Logging](#monitoring--logging)
13. [Security Best Practices](#security-best-practices)

## Prerequisites

- Google Cloud account with billing enabled
- Google Cloud CLI (`gcloud`) installed and configured
- Docker installed locally
- Domain `dreamerai.io` from GoDaddy
- API keys for:
  - OpenAI API
  - Anthropic API
  - ElevenLabs ConvAI widget
  - HeyGen video integration

## Architecture Overview

We'll use the following Google Cloud services:
- **Cloud Run**: For running containerized frontend and backend services
- **Cloud SQL**: For PostgreSQL database
- **Memorystore**: For Redis caching
- **Cloud Build**: For CI/CD pipeline
- **Cloud Load Balancing**: For SSL termination and traffic distribution
- **Cloud CDN**: For static asset caching
- **Secret Manager**: For storing sensitive configuration

### Why Cloud Run over GKE?
For your use case, Cloud Run is recommended because:
- **Simpler Management**: No Kubernetes cluster to maintain
- **Cost-Effective**: Pay only for actual usage (requests)
- **Auto-scaling**: Built-in scaling from 0 to thousands of instances
- **Faster Deployment**: Less configuration overhead
- **Perfect for Web Apps**: Ideal for request-driven workloads

## Initial Setup

### 1. Create a New Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="dreamer-ai-website"
export REGION="us-central1"

# Create project
gcloud projects create $PROJECT_ID --name="Dreamer AI Website"

# Set as active project
gcloud config set project $PROJECT_ID

# Enable billing (replace with your billing account ID)
gcloud beta billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com
```

### 2. Set Up Service Account

```bash
# Create service account
gcloud iam service-accounts create dreamer-ai-sa \
  --display-name="Dreamer AI Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:dreamer-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:dreamer-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/redis.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:dreamer-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Cloud SQL Setup

### 1. Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create dreamer-ai-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --network=default \
  --no-assign-ip \
  --backup-start-time=03:00 \
  --backup-location=$REGION \
  --retained-backups-count=7 \
  --retained-transaction-log-days=3

# Create database
gcloud sql databases create dreamerai_prod \
  --instance=dreamer-ai-db

# Create database user
gcloud sql users create dreamer \
  --instance=dreamer-ai-db \
  --password=SECURE_PASSWORD_HERE
```

### 2. Configure Private IP (Recommended for Security)

```bash
# Reserve IP range for VPC peering
gcloud compute addresses create google-managed-services-default \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default

# Create private connection
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default \
  --network=default

# Update instance to use private IP
gcloud sql instances patch dreamer-ai-db --no-assign-ip
```

## Redis Setup with Memorystore

```bash
# Create Redis instance
gcloud redis instances create dreamer-ai-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --network=default \
  --tier=basic

# Get Redis connection details
gcloud redis instances describe dreamer-ai-redis --region=$REGION
```

## Container Registry Setup

```bash
# Configure Docker authentication
gcloud auth configure-docker

# Build and push images
docker build -t gcr.io/$PROJECT_ID/dreamer-frontend:latest ./frontend
docker build -t gcr.io/$PROJECT_ID/dreamer-backend:latest ./backend

docker push gcr.io/$PROJECT_ID/dreamer-frontend:latest
docker push gcr.io/$PROJECT_ID/dreamer-backend:latest
```

## Cloud Run Deployment

### 1. Store Secrets in Secret Manager

```bash
# Store API keys and sensitive data
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-openai-api-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-anthropic-api-key" | gcloud secrets create anthropic-api-key --data-file=-
```

### 2. Deploy Backend Service

```bash
# Deploy backend to Cloud Run
gcloud run deploy dreamer-backend \
  --image=gcr.io/$PROJECT_ID/dreamer-backend:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --service-account=dreamer-ai-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:dreamer-ai-db \
  --set-env-vars="NODE_ENV=production,PORT=8080" \
  --set-secrets="JWT_SECRET=jwt-secret:latest,OPENAI_API_KEY=openai-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=100
```

### 3. Deploy Frontend Service

```bash
# Deploy frontend to Cloud Run
gcloud run deploy dreamer-frontend \
  --image=gcr.io/$PROJECT_ID/dreamer-frontend:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=20 \
  --concurrency=1000 \
  --port=80
```

## Load Balancer & SSL Configuration

### 1. Reserve Static IP

```bash
gcloud compute addresses create dreamer-ai-ip \
  --network-tier=PREMIUM \
  --ip-version=IPV4 \
  --global

# Get the IP address
gcloud compute addresses describe dreamer-ai-ip --global
```

### 2. Create HTTPS Load Balancer

```bash
# Create backend service for frontend
gcloud compute backend-services create dreamer-frontend-service \
  --global \
  --load-balancing-scheme=EXTERNAL \
  --protocol=HTTP

# Create backend service for API
gcloud compute backend-services create dreamer-api-service \
  --global \
  --load-balancing-scheme=EXTERNAL \
  --protocol=HTTP

# Create URL map
gcloud compute url-maps create dreamer-lb \
  --default-service=dreamer-frontend-service \
  --global

# Add path matcher for API
gcloud compute url-maps add-path-matcher dreamer-lb \
  --global \
  --path-matcher-name=api-matcher \
  --default-service=dreamer-frontend-service \
  --backend-service-path-rules="/api/*=dreamer-api-service"

# Create SSL certificate
gcloud compute ssl-certificates create dreamer-ssl-cert \
  --domains=dreamerai.io,www.dreamerai.io \
  --global

# Create HTTPS proxy
gcloud compute target-https-proxies create dreamer-https-proxy \
  --url-map=dreamer-lb \
  --ssl-certificates=dreamer-ssl-cert \
  --global

# Create forwarding rule
gcloud compute forwarding-rules create dreamer-https-rule \
  --address=dreamer-ai-ip \
  --global \
  --target-https-proxy=dreamer-https-proxy \
  --ports=443
```

## DNS Configuration

### Configure GoDaddy DNS

1. Log in to your GoDaddy account
2. Navigate to DNS Management for `dreamerai.io`
3. Update/Add the following records:

```
Type  | Name | Value              | TTL
------|------|-------------------|-----
A     | @    | YOUR_STATIC_IP    | 600
A     | www  | YOUR_STATIC_IP    | 600
```

Replace `YOUR_STATIC_IP` with the IP from:
```bash
gcloud compute addresses describe dreamer-ai-ip --global
```

## CI/CD with Cloud Build

### 1. Create Cloud Build Configuration

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build Frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/dreamer-frontend:$COMMIT_SHA', './frontend']
  
  # Build Backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/dreamer-backend:$COMMIT_SHA', './backend']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dreamer-frontend:$COMMIT_SHA']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dreamer-backend:$COMMIT_SHA']
  
  # Deploy Frontend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'dreamer-frontend'
      - '--image=gcr.io/$PROJECT_ID/dreamer-frontend:$COMMIT_SHA'
      - '--region=us-central1'
  
  # Deploy Backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'dreamer-backend'
      - '--image=gcr.io/$PROJECT_ID/dreamer-backend:$COMMIT_SHA'
      - '--region=us-central1'

images:
  - 'gcr.io/$PROJECT_ID/dreamer-frontend:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/dreamer-backend:$COMMIT_SHA'

timeout: '1200s'
```

### 2. Set Up Trigger

```bash
# Connect repository (GitHub)
gcloud builds triggers create github \
  --repo-name=dreamer-ai-website \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## Cost Optimization

### 1. Cloud Run Settings

```bash
# Optimize minimum instances for cost
gcloud run services update dreamer-frontend --min-instances=0 --region=$REGION
gcloud run services update dreamer-backend --min-instances=0 --region=$REGION
```

### 2. Cloud SQL Cost Optimization

```bash
# For development/testing, use shared-core instances
gcloud sql instances patch dreamer-ai-db --tier=db-f1-micro

# Enable automatic storage increase
gcloud sql instances patch dreamer-ai-db \
  --enable-auto-storage-increase \
  --storage-auto-increase-limit=50
```

### 3. Set Up Budget Alerts

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Dreamer AI Monthly Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| Cloud Run (Frontend) | 100K requests/month | $5-10 |
| Cloud Run (Backend) | 50K requests/month | $10-20 |
| Cloud SQL | db-f1-micro, 10GB | $10-15 |
| Memorystore Redis | 1GB Basic | $35 |
| Load Balancer | 1GB data/month | $18 |
| **Total** | | **$78-98/month** |

## Monitoring & Logging

### 1. Enable Cloud Monitoring

```bash
# Create uptime checks
gcloud monitoring uptime-checks create dreamer-frontend-check \
  --display-name="Frontend Health Check" \
  --resource-type=uptime-url \
  --resource-labels=host=dreamerai.io \
  --http-check-path=/ \
  --check-frequency=60s

# Create alerts
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate Alert" \
  --condition-display-name="Error rate > 1%" \
  --condition-metric-type="run.googleapis.com/request_count" \
  --condition-metric-filter='resource.type="cloud_run_revision" AND metric.response_code_class="5xx"'
```

### 2. View Logs

```bash
# View frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dreamer-frontend" --limit 50

# View backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dreamer-backend" --limit 50
```

## Security Best Practices

1. **Enable VPC Service Controls**
   ```bash
   gcloud access-context-manager perimeters create dreamer-ai-perimeter \
     --title="Dreamer AI Security Perimeter" \
     --resources=projects/$PROJECT_ID \
     --restricted-services=storage.googleapis.com,sqladmin.googleapis.com
   ```

2. **Enable Cloud Armor**
   ```bash
   gcloud compute security-policies create dreamer-security-policy \
     --description="DDoS and security protection"
   
   gcloud compute security-policies rules create 1000 \
     --security-policy=dreamer-security-policy \
     --expression="origin.region_code == 'CN'" \
     --action=deny-403
   ```

3. **Regular Security Scans**
   ```bash
   gcloud container images scan dreamer-frontend:latest
   gcloud container images scan dreamer-backend:latest
   ```

## Troubleshooting

### Common Issues

1. **Cloud SQL Connection Issues**
   - Ensure Cloud SQL Admin API is enabled
   - Check service account permissions
   - Verify VPC peering is configured

2. **SSL Certificate Not Working**
   - DNS propagation can take up to 48 hours
   - Verify domain ownership in Search Console

3. **High Costs**
   - Check Cloud Run minimum instances
   - Review Cloud SQL tier
   - Enable Cloud CDN for static assets

### Useful Commands

```bash
# Check service status
gcloud run services describe dreamer-frontend --region=$REGION

# View recent errors
gcloud logging read "severity>=ERROR" --limit 20

# Check SSL certificate status
gcloud compute ssl-certificates describe dreamer-ssl-cert --global
```

## Next Steps

1. Set up staging environment
2. Implement database backups automation
3. Configure Cloud CDN for better performance
4. Set up Cloud Armor for DDoS protection
5. Implement structured logging
6. Add application performance monitoring (APM)