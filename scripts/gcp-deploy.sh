#!/bin/bash

# Google Cloud Platform Deployment Script for Dreamer AI Website
# This script automates the deployment process to GCP

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-dreamer-ai-website}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"
BILLING_ACCOUNT_ID="${GCP_BILLING_ACCOUNT_ID}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if gcloud is installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "No active gcloud authentication found. Please run 'gcloud auth login'"
        exit 1
    fi
    
    print_status "Prerequisites check passed!"
}

# Create and configure project
setup_project() {
    print_status "Setting up Google Cloud project..."
    
    # Check if project exists
    if gcloud projects describe $PROJECT_ID &>/dev/null; then
        print_warning "Project $PROJECT_ID already exists"
    else
        print_status "Creating project $PROJECT_ID..."
        gcloud projects create $PROJECT_ID --name="Dreamer AI Website"
    fi
    
    # Set as active project
    gcloud config set project $PROJECT_ID
    
    # Link billing account if provided
    if [ -n "$BILLING_ACCOUNT_ID" ]; then
        print_status "Linking billing account..."
        gcloud beta billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID
    else
        print_warning "No billing account ID provided. Please link billing manually."
    fi
    
    # Enable required APIs
    print_status "Enabling required APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        sqladmin.googleapis.com \
        redis.googleapis.com \
        secretmanager.googleapis.com \
        cloudresourcemanager.googleapis.com \
        compute.googleapis.com \
        servicenetworking.googleapis.com \
        dns.googleapis.com
}

# Create service account
setup_service_account() {
    print_status "Setting up service account..."
    
    SA_NAME="dreamer-ai-sa"
    SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Check if service account exists
    if gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
        print_warning "Service account already exists"
    else
        gcloud iam service-accounts create $SA_NAME \
            --display-name="Dreamer AI Service Account"
    fi
    
    # Grant necessary permissions
    print_status "Granting service account permissions..."
    
    ROLES=(
        "roles/cloudsql.client"
        "roles/redis.editor"
        "roles/secretmanager.secretAccessor"
        "roles/run.invoker"
    )
    
    for role in "${ROLES[@]}"; do
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$SA_EMAIL" \
            --role="$role" \
            --quiet
    done
}

# Set up networking
setup_networking() {
    print_status "Setting up VPC networking..."
    
    # Reserve IP range for VPC peering
    if ! gcloud compute addresses describe google-managed-services-default --global &>/dev/null; then
        print_status "Creating VPC peering IP range..."
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
    else
        print_warning "VPC peering already configured"
    fi
}

# Create Cloud SQL instance
setup_cloud_sql() {
    print_status "Setting up Cloud SQL..."
    
    SQL_INSTANCE_NAME="dreamer-ai-db"
    DB_NAME="dreamerai_prod"
    DB_USER="dreamer"
    DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
    
    # Check if instance exists
    if gcloud sql instances describe $SQL_INSTANCE_NAME &>/dev/null; then
        print_warning "Cloud SQL instance already exists"
    else
        print_status "Creating Cloud SQL instance..."
        gcloud sql instances create $SQL_INSTANCE_NAME \
            --database-version=POSTGRES_15 \
            --tier=db-f1-micro \
            --region=$REGION \
            --network=default \
            --no-assign-ip \
            --backup-start-time=03:00 \
            --backup-location=$REGION \
            --retained-backups-count=7 \
            --retained-transaction-log-days=3
    fi
    
    # Create database
    if ! gcloud sql databases describe $DB_NAME --instance=$SQL_INSTANCE_NAME &>/dev/null; then
        print_status "Creating database..."
        gcloud sql databases create $DB_NAME --instance=$SQL_INSTANCE_NAME
    fi
    
    # Create user
    print_status "Creating database user..."
    gcloud sql users create $DB_USER \
        --instance=$SQL_INSTANCE_NAME \
        --password=$DB_PASSWORD || true
    
    # Store password in Secret Manager
    echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=- 2>/dev/null || \
        echo -n "$DB_PASSWORD" | gcloud secrets versions add db-password --data-file=-
    
    print_status "Database password stored in Secret Manager"
}

# Create Redis instance
setup_redis() {
    print_status "Setting up Redis (Memorystore)..."
    
    REDIS_INSTANCE_NAME="dreamer-ai-redis"
    
    # Check if instance exists
    if gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION &>/dev/null; then
        print_warning "Redis instance already exists"
    else
        print_status "Creating Redis instance..."
        gcloud redis instances create $REDIS_INSTANCE_NAME \
            --size=1 \
            --region=$REGION \
            --redis-version=redis_7_0 \
            --network=default \
            --tier=basic
    fi
    
    # Get Redis host
    REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME \
        --region=$REGION --format="value(host)")
    
    print_status "Redis instance available at: $REDIS_HOST"
}

# Store secrets
setup_secrets() {
    print_status "Setting up secrets..."
    
    # Check for required environment variables
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        print_warning "Generated random JWT secret"
    fi
    
    # Create or update secrets
    SECRETS=(
        "jwt-secret:$JWT_SECRET"
        "openai-api-key:${OPENAI_API_KEY:-your-openai-api-key}"
        "anthropic-api-key:${ANTHROPIC_API_KEY:-your-anthropic-api-key}"
    )
    
    for secret_pair in "${SECRETS[@]}"; do
        IFS=':' read -r secret_name secret_value <<< "$secret_pair"
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=- 2>/dev/null || \
            echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
    done
    
    print_status "Secrets configured successfully"
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Configure Docker authentication
    gcloud auth configure-docker --quiet
    
    # Build frontend
    print_status "Building frontend image..."
    docker build -t gcr.io/$PROJECT_ID/dreamer-frontend:latest ./frontend
    
    # Build backend
    print_status "Building backend image..."
    docker build -t gcr.io/$PROJECT_ID/dreamer-backend:latest ./backend
    
    # Push images
    print_status "Pushing images to Container Registry..."
    docker push gcr.io/$PROJECT_ID/dreamer-frontend:latest
    docker push gcr.io/$PROJECT_ID/dreamer-backend:latest
}

# Deploy to Cloud Run
deploy_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    SA_EMAIL="dreamer-ai-sa@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Get Cloud SQL connection name
    SQL_CONNECTION_NAME="$PROJECT_ID:$REGION:dreamer-ai-db"
    
    # Get Redis host
    REDIS_HOST=$(gcloud redis instances describe dreamer-ai-redis \
        --region=$REGION --format="value(host)")
    
    # Deploy backend
    print_status "Deploying backend service..."
    gcloud run deploy dreamer-backend \
        --image=gcr.io/$PROJECT_ID/dreamer-backend:latest \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --service-account=$SA_EMAIL \
        --add-cloudsql-instances=$SQL_CONNECTION_NAME \
        --set-env-vars="NODE_ENV=production,PORT=8080,REDIS_HOST=$REDIS_HOST,REDIS_PORT=6379" \
        --set-secrets="JWT_SECRET=jwt-secret:latest,OPENAI_API_KEY=openai-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_PASSWORD=db-password:latest" \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=10 \
        --concurrency=100
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe dreamer-backend \
        --region=$REGION --format="value(status.url)")
    
    # Deploy frontend
    print_status "Deploying frontend service..."
    gcloud run deploy dreamer-frontend \
        --image=gcr.io/$PROJECT_ID/dreamer-frontend:latest \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --set-env-vars="REACT_APP_API_URL=$BACKEND_URL" \
        --memory=256Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=20 \
        --concurrency=1000 \
        --port=80
    
    print_status "Cloud Run services deployed successfully!"
}

# Set up load balancer
setup_load_balancer() {
    print_status "Setting up HTTPS Load Balancer..."
    
    # This is a complex process that requires the script to be split
    print_warning "Load balancer setup requires additional configuration."
    print_warning "Please run ./scripts/gcp-setup-lb.sh after this script completes."
}

# Main execution
main() {
    print_status "Starting Google Cloud deployment for Dreamer AI Website..."
    
    check_prerequisites
    setup_project
    setup_service_account
    setup_networking
    setup_cloud_sql
    setup_redis
    setup_secrets
    build_and_push_images
    deploy_cloud_run
    
    print_status "=== Deployment Complete! ==="
    print_status "Frontend URL: $(gcloud run services describe dreamer-frontend --region=$REGION --format='value(status.url)')"
    print_status "Backend URL: $(gcloud run services describe dreamer-backend --region=$REGION --format='value(status.url)')"
    print_warning "Next step: Run ./scripts/gcp-setup-lb.sh to configure HTTPS load balancer"
}

# Run main function
main