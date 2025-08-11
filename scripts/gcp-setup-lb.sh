#!/bin/bash

# Google Cloud Platform Load Balancer Setup Script
# This script sets up HTTPS load balancing for the Dreamer AI Website

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-dreamer-ai-website}"
REGION="${GCP_REGION:-us-central1}"
DOMAIN="dreamerai.io"
DOMAIN_WWW="www.dreamerai.io"

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Get Cloud Run service URLs
    FRONTEND_URL=$(gcloud run services describe dreamer-frontend --region=$REGION --format='value(status.url)')
    BACKEND_URL=$(gcloud run services describe dreamer-backend --region=$REGION --format='value(status.url)')
    
    if [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
        print_error "Cloud Run services not found. Please run gcp-deploy.sh first."
        exit 1
    fi
    
    print_status "Found services:"
    print_status "  Frontend: $FRONTEND_URL"
    print_status "  Backend: $BACKEND_URL"
}

# Reserve static IP
create_static_ip() {
    print_status "Creating static IP address..."
    
    if gcloud compute addresses describe dreamer-ai-ip --global &>/dev/null; then
        print_warning "Static IP already exists"
    else
        gcloud compute addresses create dreamer-ai-ip \
            --network-tier=PREMIUM \
            --ip-version=IPV4 \
            --global
    fi
    
    # Get the IP address
    STATIC_IP=$(gcloud compute addresses describe dreamer-ai-ip --global --format='value(address)')
    print_status "Static IP: $STATIC_IP"
}

# Create NEGs for Cloud Run services
create_serverless_negs() {
    print_status "Creating Network Endpoint Groups (NEGs)..."
    
    # Create frontend NEG
    if ! gcloud compute network-endpoint-groups describe dreamer-frontend-neg --region=$REGION &>/dev/null; then
        gcloud compute network-endpoint-groups create dreamer-frontend-neg \
            --region=$REGION \
            --network-endpoint-type=serverless \
            --cloud-run-service=dreamer-frontend
    fi
    
    # Create backend NEG
    if ! gcloud compute network-endpoint-groups describe dreamer-backend-neg --region=$REGION &>/dev/null; then
        gcloud compute network-endpoint-groups create dreamer-backend-neg \
            --region=$REGION \
            --network-endpoint-type=serverless \
            --cloud-run-service=dreamer-backend
    fi
}

# Create backend services
create_backend_services() {
    print_status "Creating backend services..."
    
    # Frontend backend service
    if ! gcloud compute backend-services describe dreamer-frontend-service --global &>/dev/null; then
        gcloud compute backend-services create dreamer-frontend-service \
            --global \
            --load-balancing-scheme=EXTERNAL_MANAGED
        
        gcloud compute backend-services add-backend dreamer-frontend-service \
            --global \
            --network-endpoint-group=dreamer-frontend-neg \
            --network-endpoint-group-region=$REGION
    fi
    
    # Backend API service
    if ! gcloud compute backend-services describe dreamer-api-service --global &>/dev/null; then
        gcloud compute backend-services create dreamer-api-service \
            --global \
            --load-balancing-scheme=EXTERNAL_MANAGED
        
        gcloud compute backend-services add-backend dreamer-api-service \
            --global \
            --network-endpoint-group=dreamer-backend-neg \
            --network-endpoint-group-region=$REGION
    fi
    
    # Enable Cloud CDN for frontend
    print_status "Enabling Cloud CDN for frontend..."
    gcloud compute backend-services update dreamer-frontend-service \
        --global \
        --enable-cdn \
        --cache-mode=CACHE_ALL_STATIC \
        --default-ttl=3600 \
        --max-ttl=86400 \
        --negative-caching
}

# Create URL map
create_url_map() {
    print_status "Creating URL map..."
    
    if ! gcloud compute url-maps describe dreamer-lb --global &>/dev/null; then
        # Create URL map with frontend as default
        gcloud compute url-maps create dreamer-lb \
            --default-service=dreamer-frontend-service \
            --global
    fi
    
    # Create path matcher for API routes
    cat > /tmp/path-matcher.yaml << EOF
name: api-matcher
defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/dreamer-frontend-service
pathRules:
- paths:
  - /api
  - /api/*
  service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/dreamer-api-service
- paths:
  - /auth
  - /auth/*
  service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/dreamer-api-service
- paths:
  - /health
  service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/dreamer-api-service
EOF
    
    gcloud compute url-maps import dreamer-lb \
        --source=/tmp/path-matcher.yaml \
        --global \
        --quiet
    
    rm /tmp/path-matcher.yaml
}

# Create SSL certificate
create_ssl_certificate() {
    print_status "Creating managed SSL certificate..."
    
    if ! gcloud compute ssl-certificates describe dreamer-ssl-cert --global &>/dev/null; then
        gcloud compute ssl-certificates create dreamer-ssl-cert \
            --domains=$DOMAIN,$DOMAIN_WWW \
            --global
    else
        print_warning "SSL certificate already exists"
    fi
}

# Create HTTPS proxy and forwarding rules
create_https_proxy() {
    print_status "Creating HTTPS proxy..."
    
    if ! gcloud compute target-https-proxies describe dreamer-https-proxy --global &>/dev/null; then
        gcloud compute target-https-proxies create dreamer-https-proxy \
            --url-map=dreamer-lb \
            --ssl-certificates=dreamer-ssl-cert \
            --global
    fi
    
    # Create HTTPS forwarding rule
    if ! gcloud compute forwarding-rules describe dreamer-https-rule --global &>/dev/null; then
        gcloud compute forwarding-rules create dreamer-https-rule \
            --address=dreamer-ai-ip \
            --global \
            --target-https-proxy=dreamer-https-proxy \
            --ports=443
    fi
    
    # Create HTTP to HTTPS redirect
    create_http_redirect
}

# Create HTTP to HTTPS redirect
create_http_redirect() {
    print_status "Setting up HTTP to HTTPS redirect..."
    
    # Create redirect URL map
    if ! gcloud compute url-maps describe dreamer-http-redirect --global &>/dev/null; then
        gcloud compute url-maps import dreamer-http-redirect \
            --global \
            --source=/dev/stdin <<EOF
kind: compute#urlMap
name: dreamer-http-redirect
defaultUrlRedirect:
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  httpsRedirect: true
  stripQuery: false
EOF
    fi
    
    # Create HTTP proxy
    if ! gcloud compute target-http-proxies describe dreamer-http-proxy --global &>/dev/null; then
        gcloud compute target-http-proxies create dreamer-http-proxy \
            --url-map=dreamer-http-redirect \
            --global
    fi
    
    # Create HTTP forwarding rule
    if ! gcloud compute forwarding-rules describe dreamer-http-rule --global &>/dev/null; then
        gcloud compute forwarding-rules create dreamer-http-rule \
            --address=dreamer-ai-ip \
            --global \
            --target-http-proxy=dreamer-http-proxy \
            --ports=80
    fi
}

# Create Cloud Armor security policy
create_security_policy() {
    print_status "Creating Cloud Armor security policy..."
    
    if ! gcloud compute security-policies describe dreamer-security-policy &>/dev/null; then
        gcloud compute security-policies create dreamer-security-policy \
            --description="Security policy for Dreamer AI Website"
    fi
    
    # Add rate limiting rule
    gcloud compute security-policies rules create 1000 \
        --security-policy=dreamer-security-policy \
        --expression="true" \
        --action=rate-based-ban \
        --rate-limit-threshold-count=100 \
        --rate-limit-threshold-interval-sec=60 \
        --ban-duration-sec=600 \
        --conform-action=allow \
        --exceed-action=deny-429 \
        --enforce-on-key=IP 2>/dev/null || true
    
    # Block known bad regions (optional)
    gcloud compute security-policies rules create 2000 \
        --security-policy=dreamer-security-policy \
        --expression="origin.region_code == 'CN' || origin.region_code == 'RU'" \
        --action=deny-403 2>/dev/null || true
    
    # Apply security policy to backend services
    gcloud compute backend-services update dreamer-frontend-service \
        --global \
        --security-policy=dreamer-security-policy
    
    gcloud compute backend-services update dreamer-api-service \
        --global \
        --security-policy=dreamer-security-policy
}

# Display DNS configuration
display_dns_config() {
    print_status "=== DNS Configuration ==="
    print_status "Please update your GoDaddy DNS records with the following:"
    echo ""
    echo "Type  | Name | Value              | TTL"
    echo "------|------|-------------------|-----"
    echo "A     | @    | $STATIC_IP       | 600"
    echo "A     | www  | $STATIC_IP       | 600"
    echo ""
    print_warning "DNS propagation can take up to 48 hours"
    print_warning "SSL certificate provisioning typically takes 10-15 minutes after DNS is configured"
}

# Check SSL certificate status
check_ssl_status() {
    print_status "Checking SSL certificate status..."
    
    SSL_STATUS=$(gcloud compute ssl-certificates describe dreamer-ssl-cert \
        --global --format='value(managed.status)')
    
    if [ "$SSL_STATUS" == "ACTIVE" ]; then
        print_status "SSL certificate is active!"
    else
        print_warning "SSL certificate status: $SSL_STATUS"
        print_warning "Certificate is still being provisioned. This can take 10-15 minutes."
    fi
}

# Main execution
main() {
    print_status "Starting Load Balancer setup for Dreamer AI Website..."
    
    check_prerequisites
    create_static_ip
    create_serverless_negs
    create_backend_services
    create_url_map
    create_ssl_certificate
    create_https_proxy
    create_security_policy
    
    print_status "=== Load Balancer Setup Complete! ==="
    display_dns_config
    
    print_status ""
    print_status "Your website will be available at:"
    print_status "  https://$DOMAIN"
    print_status "  https://$DOMAIN_WWW"
    
    check_ssl_status
    
    print_status ""
    print_status "To monitor SSL certificate status:"
    print_status "  gcloud compute ssl-certificates describe dreamer-ssl-cert --global"
}

# Run main function
main