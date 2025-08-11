#!/bin/bash

# Google Cloud Platform Cleanup Script
# This script safely removes all resources created for the Dreamer AI Website

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-dreamer-ai-website}"
REGION="${GCP_REGION:-us-central1}"

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

# Confirm deletion
confirm_deletion() {
    print_warning "This will delete ALL resources for the Dreamer AI Website!"
    print_warning "Project: $PROJECT_ID"
    echo ""
    echo "Resources to be deleted:"
    echo "  - Cloud Run services (frontend and backend)"
    echo "  - Cloud SQL instance and databases"
    echo "  - Redis instance"
    echo "  - Load balancer and related resources"
    echo "  - SSL certificates"
    echo "  - Container images"
    echo "  - Secrets"
    echo "  - Service accounts"
    echo ""
    read -p "Are you sure you want to continue? Type 'DELETE' to confirm: " confirmation
    
    if [ "$confirmation" != "DELETE" ]; then
        print_error "Deletion cancelled"
        exit 1
    fi
}

# Delete Cloud Run services
delete_cloud_run() {
    print_status "Deleting Cloud Run services..."
    
    SERVICES=("dreamer-frontend" "dreamer-backend")
    
    for service in "${SERVICES[@]}"; do
        if gcloud run services describe $service --region=$REGION &>/dev/null; then
            print_status "Deleting $service..."
            gcloud run services delete $service --region=$REGION --quiet
        else
            print_warning "Service $service not found"
        fi
    done
}

# Delete load balancer resources
delete_load_balancer() {
    print_status "Deleting load balancer resources..."
    
    # Delete forwarding rules
    for rule in "dreamer-https-rule" "dreamer-http-rule"; do
        if gcloud compute forwarding-rules describe $rule --global &>/dev/null; then
            print_status "Deleting forwarding rule $rule..."
            gcloud compute forwarding-rules delete $rule --global --quiet
        fi
    done
    
    # Delete target proxies
    for proxy in "dreamer-https-proxy" "dreamer-http-proxy"; do
        if gcloud compute target-https-proxies describe $proxy --global &>/dev/null 2>&1 || \
           gcloud compute target-http-proxies describe $proxy --global &>/dev/null 2>&1; then
            print_status "Deleting proxy $proxy..."
            gcloud compute target-https-proxies delete $proxy --global --quiet 2>/dev/null || \
            gcloud compute target-http-proxies delete $proxy --global --quiet 2>/dev/null
        fi
    done
    
    # Delete URL maps
    for urlmap in "dreamer-lb" "dreamer-http-redirect"; do
        if gcloud compute url-maps describe $urlmap --global &>/dev/null; then
            print_status "Deleting URL map $urlmap..."
            gcloud compute url-maps delete $urlmap --global --quiet
        fi
    done
    
    # Delete backend services
    for backend in "dreamer-frontend-service" "dreamer-api-service"; do
        if gcloud compute backend-services describe $backend --global &>/dev/null; then
            print_status "Deleting backend service $backend..."
            gcloud compute backend-services delete $backend --global --quiet
        fi
    done
    
    # Delete NEGs
    for neg in "dreamer-frontend-neg" "dreamer-backend-neg"; do
        if gcloud compute network-endpoint-groups describe $neg --region=$REGION &>/dev/null; then
            print_status "Deleting NEG $neg..."
            gcloud compute network-endpoint-groups delete $neg --region=$REGION --quiet
        fi
    done
    
    # Delete SSL certificate
    if gcloud compute ssl-certificates describe dreamer-ssl-cert --global &>/dev/null; then
        print_status "Deleting SSL certificate..."
        gcloud compute ssl-certificates delete dreamer-ssl-cert --global --quiet
    fi
    
    # Delete security policy
    if gcloud compute security-policies describe dreamer-security-policy &>/dev/null; then
        print_status "Deleting security policy..."
        gcloud compute security-policies delete dreamer-security-policy --quiet
    fi
    
    # Delete static IP
    if gcloud compute addresses describe dreamer-ai-ip --global &>/dev/null; then
        print_status "Deleting static IP..."
        gcloud compute addresses delete dreamer-ai-ip --global --quiet
    fi
}

# Delete Cloud SQL
delete_cloud_sql() {
    print_status "Deleting Cloud SQL instance..."
    
    if gcloud sql instances describe dreamer-ai-db &>/dev/null; then
        print_status "Deleting Cloud SQL instance dreamer-ai-db..."
        gcloud sql instances delete dreamer-ai-db --quiet
    else
        print_warning "Cloud SQL instance not found"
    fi
}

# Delete Redis
delete_redis() {
    print_status "Deleting Redis instance..."
    
    if gcloud redis instances describe dreamer-ai-redis --region=$REGION &>/dev/null; then
        print_status "Deleting Redis instance dreamer-ai-redis..."
        gcloud redis instances delete dreamer-ai-redis --region=$REGION --quiet
    else
        print_warning "Redis instance not found"
    fi
}

# Delete secrets
delete_secrets() {
    print_status "Deleting secrets..."
    
    SECRETS=(
        "jwt-secret"
        "openai-api-key"
        "anthropic-api-key"
        "db-password"
    )
    
    for secret in "${SECRETS[@]}"; do
        if gcloud secrets describe $secret &>/dev/null; then
            print_status "Deleting secret $secret..."
            gcloud secrets delete $secret --quiet
        fi
    done
}

# Delete container images
delete_container_images() {
    print_status "Deleting container images..."
    
    # List and delete frontend images
    print_status "Deleting frontend images..."
    gcloud container images list-tags gcr.io/$PROJECT_ID/dreamer-frontend \
        --format='get(digest)' | \
        xargs -I {} gcloud container images delete \
        "gcr.io/$PROJECT_ID/dreamer-frontend@{}" --quiet 2>/dev/null || true
    
    # List and delete backend images
    print_status "Deleting backend images..."
    gcloud container images list-tags gcr.io/$PROJECT_ID/dreamer-backend \
        --format='get(digest)' | \
        xargs -I {} gcloud container images delete \
        "gcr.io/$PROJECT_ID/dreamer-backend@{}" --quiet 2>/dev/null || true
}

# Delete service account
delete_service_account() {
    print_status "Deleting service account..."
    
    SA_EMAIL="dreamer-ai-sa@$PROJECT_ID.iam.gserviceaccount.com"
    
    if gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
        print_status "Deleting service account..."
        gcloud iam service-accounts delete $SA_EMAIL --quiet
    else
        print_warning "Service account not found"
    fi
}

# Delete VPC peering
delete_vpc_peering() {
    print_status "Deleting VPC peering..."
    
    # Delete VPC peering connection
    if gcloud services vpc-peerings list --service=servicenetworking.googleapis.com | grep -q "google-managed-services-default"; then
        print_status "Removing VPC peering..."
        gcloud services vpc-peerings delete \
            --service=servicenetworking.googleapis.com \
            --network=default \
            --quiet || true
    fi
    
    # Delete IP range
    if gcloud compute addresses describe google-managed-services-default --global &>/dev/null; then
        print_status "Deleting VPC IP range..."
        gcloud compute addresses delete google-managed-services-default --global --quiet
    fi
}

# Main cleanup function
main() {
    print_status "Starting Google Cloud cleanup for Dreamer AI Website..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Confirm deletion
    confirm_deletion
    
    # Start cleanup
    print_status "Beginning resource deletion..."
    
    # Delete resources in order (dependencies first)
    delete_cloud_run
    delete_load_balancer
    delete_cloud_sql
    delete_redis
    delete_secrets
    delete_container_images
    delete_service_account
    delete_vpc_peering
    
    print_status "=== Cleanup Complete! ==="
    print_warning "Note: The project itself was not deleted."
    print_warning "To delete the project entirely, run:"
    print_warning "  gcloud projects delete $PROJECT_ID"
}

# Run main function
main