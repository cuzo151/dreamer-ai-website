#!/bin/bash

# Dreamer AI Solutions - Development Deployment Script
# This script manages the complete development environment deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
ACTION=""
PROFILE="default"
FOLLOW_LOGS=false

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS] ACTION"
    echo ""
    echo "Actions:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status"
    echo "  logs        Show service logs"
    echo "  clean       Stop services and remove volumes"
    echo "  reset       Complete reset (clean + remove images)"
    echo "  setup       Initial setup (generate certs, create .env)"
    echo ""
    echo "Options:"
    echo "  -p, --profile PROFILE   Use docker-compose profile (default, tools, monitoring)"
    echo "  -f, --follow            Follow logs output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                      # Start basic services"
    echo "  $0 -p tools start             # Start with management tools"
    echo "  $0 -p monitoring start        # Start with full monitoring"
    echo "  $0 logs -f backend            # Follow backend logs"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW_LOGS=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        start|stop|restart|status|logs|clean|reset|setup)
            ACTION="$1"
            shift
            break
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

if [ -z "$ACTION" ]; then
    echo -e "${RED}Error: No action specified${NC}"
    usage
    exit 1
fi

cd "$PROJECT_ROOT"

# Setup function
setup_environment() {
    echo -e "${BLUE}🔧 Setting up development environment...${NC}"
    
    # Generate SSL certificates
    if [ ! -f "certs/server.crt" ]; then
        echo "Generating SSL certificates..."
        cd scripts/deploy
        ./generate-certs.sh
        cd "$PROJECT_ROOT"
    else
        echo "SSL certificates already exist"
    fi
    
    # Create .env file from template
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cp .env.development .env
        echo -e "${YELLOW}⚠️  Please update .env with your API keys${NC}"
    else
        echo ".env file already exists"
    fi
    
    # Create necessary directories
    mkdir -p logs uploads backups monitoring/prometheus/alerts
    
    # Set up hosts file reminder
    echo -e "${YELLOW}⚠️  Don't forget to update your /etc/hosts file!${NC}"
    echo "Run: sudo nano /etc/hosts"
    echo "Add the following entries:"
    cat scripts/deploy/generate-certs.sh | grep -A 10 "Add the following entries" | tail -n 10
    
    echo -e "${GREEN}✅ Setup complete!${NC}"
}

# Start services
start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    # Check if setup has been done
    if [ ! -f "certs/server.crt" ] || [ ! -f ".env" ]; then
        echo "Running initial setup..."
        setup_environment
    fi
    
    # Determine which compose files to use
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
    
    case $PROFILE in
        tools)
            echo "Starting with management tools..."
            docker-compose $COMPOSE_FILES --profile tools up -d
            ;;
        monitoring)
            echo "Starting with full monitoring stack..."
            docker-compose $COMPOSE_FILES --profile tools up -d
            ;;
        *)
            echo "Starting basic services..."
            docker-compose $COMPOSE_FILES up -d
            ;;
    esac
    
    # Wait for services to be ready
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Run database migrations
    echo "Running database migrations..."
    docker-compose $COMPOSE_FILES exec -T backend npm run db:migrate || echo "Migrations skipped or already applied"
    
    # Show status
    show_status
    
    echo -e "${GREEN}✅ Services started successfully!${NC}"
    echo ""
    echo "Access points:"
    echo -e "  Frontend:         ${GREEN}https://dreamer.local${NC}"
    echo -e "  Backend API:      ${GREEN}https://api.dreamer.local${NC}"
    echo -e "  Traefik Dashboard: ${GREEN}https://traefik.dreamer.local${NC} (admin/admin)"
    
    if [[ "$PROFILE" == "tools" ]] || [[ "$PROFILE" == "monitoring" ]]; then
        echo -e "  pgAdmin:          ${GREEN}https://pgadmin.dreamer.local${NC}"
        echo -e "  Redis Commander:  ${GREEN}https://redis.dreamer.local${NC}"
        echo -e "  Mailhog:          ${GREEN}https://mail.dreamer.local${NC}"
        echo -e "  Portainer:        ${GREEN}https://portainer.dreamer.local${NC}"
    fi
    
    if [[ "$PROFILE" == "monitoring" ]]; then
        echo -e "  Prometheus:       ${GREEN}https://prometheus.dreamer.local${NC}"
        echo -e "  Grafana:          ${GREEN}https://grafana.dreamer.local${NC} (admin/admin)"
        echo -e "  Jaeger:           ${GREEN}https://jaeger.dreamer.local${NC}"
    fi
}

# Stop services
stop_services() {
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
    docker-compose $COMPOSE_FILES --profile tools down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Restart services
restart_services() {
    stop_services
    sleep 2
    start_services
}

# Show status
show_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
    docker-compose $COMPOSE_FILES ps
    
    # Check health endpoints
    echo -e "\n${BLUE}🏥 Health Checks:${NC}"
    
    # Backend health
    if curl -s -k https://api.dreamer.local/health > /dev/null 2>&1; then
        echo -e "  Backend API: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "  Backend API: ${RED}✗ Unhealthy${NC}"
    fi
    
    # Frontend health
    if curl -s -k https://dreamer.local > /dev/null 2>&1; then
        echo -e "  Frontend:    ${GREEN}✓ Healthy${NC}"
    else
        echo -e "  Frontend:    ${RED}✗ Unhealthy${NC}"
    fi
}

# Show logs
show_logs() {
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
    SERVICE="${2:-}"
    
    if [ -z "$SERVICE" ]; then
        if [ "$FOLLOW_LOGS" = true ]; then
            docker-compose $COMPOSE_FILES logs -f --tail=100
        else
            docker-compose $COMPOSE_FILES logs --tail=100
        fi
    else
        if [ "$FOLLOW_LOGS" = true ]; then
            docker-compose $COMPOSE_FILES logs -f --tail=100 "$SERVICE"
        else
            docker-compose $COMPOSE_FILES logs --tail=100 "$SERVICE"
        fi
    fi
}

# Clean environment
clean_environment() {
    echo -e "${YELLOW}⚠️  This will stop all services and remove volumes${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🧹 Cleaning environment...${NC}"
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
        docker-compose $COMPOSE_FILES --profile tools down -v
        echo -e "${GREEN}✅ Environment cleaned${NC}"
    else
        echo "Cancelled"
    fi
}

# Reset environment
reset_environment() {
    echo -e "${RED}⚠️  This will completely reset the environment${NC}"
    echo "This includes:"
    echo "  - Stopping all services"
    echo "  - Removing all volumes"
    echo "  - Removing all images"
    echo "  - Removing SSL certificates"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Resetting environment...${NC}"
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
        docker-compose $COMPOSE_FILES --profile tools down -v --rmi all
        rm -rf certs/*.crt certs/*.key certs/*.csr certs/*.conf
        echo -e "${GREEN}✅ Environment reset complete${NC}"
        echo "Run '$0 setup' to set up again"
    else
        echo "Cancelled"
    fi
}

# Execute action
case $ACTION in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    clean)
        clean_environment
        ;;
    reset)
        reset_environment
        ;;
    setup)
        setup_environment
        ;;
    *)
        echo -e "${RED}Unknown action: $ACTION${NC}"
        usage
        exit 1
        ;;
esac