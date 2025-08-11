#!/bin/bash

# Google Cloud Platform Monitoring and Cost Optimization Script
# This script helps monitor resources and optimize costs

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Set project
gcloud config set project $PROJECT_ID

# Check Cloud Run services
check_cloud_run() {
    print_status "=== Cloud Run Services Status ==="
    
    SERVICES=("dreamer-frontend" "dreamer-backend")
    
    for service in "${SERVICES[@]}"; do
        echo ""
        print_info "Service: $service"
        
        # Get service details
        if gcloud run services describe $service --region=$REGION &>/dev/null; then
            # Get metrics
            URL=$(gcloud run services describe $service --region=$REGION --format='value(status.url)')
            READY=$(gcloud run services describe $service --region=$REGION --format='value(status.conditions[0].status)')
            
            # Get configuration
            MIN_INSTANCES=$(gcloud run services describe $service --region=$REGION --format='value(spec.template.metadata.annotations.autoscaling.knative.dev/minScale)')
            MAX_INSTANCES=$(gcloud run services describe $service --region=$REGION --format='value(spec.template.metadata.annotations.autoscaling.knative.dev/maxScale)')
            MEMORY=$(gcloud run services describe $service --region=$REGION --format='value(spec.template.spec.containers[0].resources.limits.memory)')
            CPU=$(gcloud run services describe $service --region=$REGION --format='value(spec.template.spec.containers[0].resources.limits.cpu)')
            
            echo "  URL: $URL"
            echo "  Status: $READY"
            echo "  Scaling: $MIN_INSTANCES - $MAX_INSTANCES instances"
            echo "  Resources: $CPU CPU, $MEMORY memory"
            
            # Check if service is healthy
            if [ "$READY" = "True" ]; then
                print_status "  ✓ Service is healthy"
            else
                print_error "  ✗ Service is unhealthy"
            fi
        else
            print_error "Service $service not found"
        fi
    done
}

# Check Cloud SQL
check_cloud_sql() {
    print_status "=== Cloud SQL Status ==="
    
    INSTANCE_NAME="dreamer-ai-db"
    
    if gcloud sql instances describe $INSTANCE_NAME &>/dev/null; then
        STATE=$(gcloud sql instances describe $INSTANCE_NAME --format='value(state)')
        TIER=$(gcloud sql instances describe $INSTANCE_NAME --format='value(settings.tier)')
        DISK_SIZE=$(gcloud sql instances describe $INSTANCE_NAME --format='value(currentDiskSize)')
        DISK_USED=$(gcloud sql instances describe $INSTANCE_NAME --format='value(diskUsageBytes)')
        
        echo "  Instance: $INSTANCE_NAME"
        echo "  State: $STATE"
        echo "  Tier: $TIER"
        echo "  Disk Size: $((DISK_SIZE / 1073741824)) GB"
        
        if [ -n "$DISK_USED" ]; then
            DISK_USED_GB=$((DISK_USED / 1073741824))
            echo "  Disk Used: $DISK_USED_GB GB"
        fi
        
        # Check if running
        if [ "$STATE" = "RUNNABLE" ]; then
            print_status "  ✓ Database is running"
        else
            print_error "  ✗ Database is not running"
        fi
    else
        print_error "Cloud SQL instance not found"
    fi
}

# Check Redis
check_redis() {
    print_status "=== Redis (Memorystore) Status ==="
    
    INSTANCE_NAME="dreamer-ai-redis"
    
    if gcloud redis instances describe $INSTANCE_NAME --region=$REGION &>/dev/null; then
        STATE=$(gcloud redis instances describe $INSTANCE_NAME --region=$REGION --format='value(state)')
        TIER=$(gcloud redis instances describe $INSTANCE_NAME --region=$REGION --format='value(tier)')
        MEMORY=$(gcloud redis instances describe $INSTANCE_NAME --region=$REGION --format='value(memorySizeGb)')
        
        echo "  Instance: $INSTANCE_NAME"
        echo "  State: $STATE"
        echo "  Tier: $TIER"
        echo "  Memory: ${MEMORY} GB"
        
        # Check if ready
        if [ "$STATE" = "READY" ]; then
            print_status "  ✓ Redis is ready"
        else
            print_error "  ✗ Redis is not ready"
        fi
    else
        print_error "Redis instance not found"
    fi
}

# Check costs
check_costs() {
    print_status "=== Cost Analysis ==="
    
    # Get current month
    CURRENT_MONTH=$(date +%Y-%m)
    START_DATE="${CURRENT_MONTH}-01"
    END_DATE=$(date +%Y-%m-%d)
    
    print_info "Analyzing costs from $START_DATE to $END_DATE..."
    
    # Note: This requires billing export to be configured
    # For now, we'll show estimated costs based on resource configuration
    
    echo ""
    print_info "Estimated Monthly Costs:"
    
    # Cloud Run estimates
    echo "  Cloud Run Frontend: ~\$5-10 (based on traffic)"
    echo "  Cloud Run Backend: ~\$10-20 (based on traffic)"
    
    # Cloud SQL estimate
    SQL_TIER=$(gcloud sql instances describe dreamer-ai-db --format='value(settings.tier)' 2>/dev/null || echo "unknown")
    case $SQL_TIER in
        "db-f1-micro")
            echo "  Cloud SQL: ~\$10-15"
            ;;
        "db-g1-small")
            echo "  Cloud SQL: ~\$30-40"
            ;;
        *)
            echo "  Cloud SQL: Check tier $SQL_TIER"
            ;;
    esac
    
    # Redis estimate
    REDIS_SIZE=$(gcloud redis instances describe dreamer-ai-redis --region=$REGION --format='value(memorySizeGb)' 2>/dev/null || echo "0")
    REDIS_COST=$((REDIS_SIZE * 35))
    echo "  Redis: ~\$$REDIS_COST"
    
    # Load balancer
    echo "  Load Balancer: ~\$18"
    echo "  ------------------------"
    echo "  Estimated Total: ~\$78-98/month"
}

# Cost optimization recommendations
cost_optimization() {
    print_status "=== Cost Optimization Recommendations ==="
    
    echo ""
    
    # Check Cloud Run minimum instances
    for service in "dreamer-frontend" "dreamer-backend"; do
        if gcloud run services describe $service --region=$REGION &>/dev/null; then
            MIN_INSTANCES=$(gcloud run services describe $service --region=$REGION --format='value(spec.template.metadata.annotations.autoscaling.knative.dev/minScale)' || echo "0")
            
            if [ "$MIN_INSTANCES" != "0" ]; then
                print_warning "Consider setting minimum instances to 0 for $service to save costs during low traffic"
                echo "    Command: gcloud run services update $service --min-instances=0 --region=$REGION"
            fi
        fi
    done
    
    # Check Cloud SQL tier
    SQL_TIER=$(gcloud sql instances describe dreamer-ai-db --format='value(settings.tier)' 2>/dev/null || echo "unknown")
    if [ "$SQL_TIER" != "db-f1-micro" ]; then
        print_warning "Consider using db-f1-micro tier for Cloud SQL if performance allows"
        echo "    Command: gcloud sql instances patch dreamer-ai-db --tier=db-f1-micro"
    fi
    
    # Check for unused resources
    print_info ""
    print_info "Other cost-saving tips:"
    echo "  - Enable Cloud CDN for static assets (already configured)"
    echo "  - Use Cloud Scheduler to scale down during off-hours"
    echo "  - Set up budget alerts to monitor spending"
    echo "  - Review and delete old Container Registry images"
}

# Set up monitoring alerts
setup_monitoring() {
    print_status "=== Setting Up Monitoring Alerts ==="
    
    # This would create monitoring alerts, but requires more configuration
    print_info "To set up monitoring alerts, use the Google Cloud Console:"
    echo "  1. Go to Monitoring > Alerting"
    echo "  2. Create alerts for:"
    echo "     - Cloud Run error rate > 1%"
    echo "     - Cloud SQL CPU usage > 80%"
    echo "     - Redis memory usage > 90%"
    echo "     - SSL certificate expiration < 30 days"
}

# Check SSL certificate
check_ssl() {
    print_status "=== SSL Certificate Status ==="
    
    if gcloud compute ssl-certificates describe dreamer-ssl-cert --global &>/dev/null; then
        STATUS=$(gcloud compute ssl-certificates describe dreamer-ssl-cert --global --format='value(managed.status)')
        DOMAINS=$(gcloud compute ssl-certificates describe dreamer-ssl-cert --global --format='value(managed.domains)')
        
        echo "  Certificate: dreamer-ssl-cert"
        echo "  Status: $STATUS"
        echo "  Domains: $DOMAINS"
        
        if [ "$STATUS" = "ACTIVE" ]; then
            print_status "  ✓ SSL certificate is active"
        else
            print_warning "  ⚠ SSL certificate status: $STATUS"
        fi
    else
        print_error "SSL certificate not found"
    fi
}

# Performance metrics
check_performance() {
    print_status "=== Performance Metrics (Last 24 Hours) ==="
    
    # Get Cloud Run metrics
    for service in "dreamer-frontend" "dreamer-backend"; do
        echo ""
        print_info "Service: $service"
        
        # This would show actual metrics, but requires metrics API setup
        echo "  View metrics in Cloud Console:"
        echo "  https://console.cloud.google.com/run/detail/$REGION/$service/metrics?project=$PROJECT_ID"
    done
}

# Main menu
show_menu() {
    echo ""
    print_status "=== Google Cloud Monitoring Dashboard ==="
    echo ""
    echo "1. Check all services status"
    echo "2. View cost analysis"
    echo "3. Show optimization recommendations"
    echo "4. Check SSL certificate"
    echo "5. View performance metrics"
    echo "6. Set up monitoring alerts"
    echo "7. Run full diagnostic"
    echo "8. Exit"
    echo ""
    read -p "Select option (1-8): " choice
    
    case $choice in
        1) check_cloud_run; check_cloud_sql; check_redis ;;
        2) check_costs ;;
        3) cost_optimization ;;
        4) check_ssl ;;
        5) check_performance ;;
        6) setup_monitoring ;;
        7) 
            check_cloud_run
            echo ""
            check_cloud_sql
            echo ""
            check_redis
            echo ""
            check_ssl
            echo ""
            check_costs
            echo ""
            cost_optimization
            ;;
        8) exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
    
    # Show menu again
    show_menu
}

# Main execution
main() {
    # If no arguments, show menu
    if [ $# -eq 0 ]; then
        show_menu
    else
        # Run specific check based on argument
        case $1 in
            status) check_cloud_run; check_cloud_sql; check_redis ;;
            costs) check_costs ;;
            optimize) cost_optimization ;;
            ssl) check_ssl ;;
            performance) check_performance ;;
            full) 
                check_cloud_run
                echo ""
                check_cloud_sql
                echo ""
                check_redis
                echo ""
                check_ssl
                echo ""
                check_costs
                echo ""
                cost_optimization
                ;;
            *) 
                print_error "Unknown option: $1"
                echo "Usage: $0 [status|costs|optimize|ssl|performance|full]"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"