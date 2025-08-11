#!/bin/bash

# Dreamer AI Solutions - Deployment Status Check Script
# This script checks the health and status of all deployed services

echo "========================================="
echo "Dreamer AI Solutions - Deployment Status"
echo "========================================="
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    # Use curl with timeout
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ OK (HTTP $response)"
        return 0
    else
        echo "❌ Failed (HTTP $response)"
        return 1
    fi
}

# Function to check Docker container status
check_container() {
    local container_name=$1
    
    echo -n "Container $container_name: "
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "^$container_name.*Up"; then
        status=$(docker ps --format "{{.Status}}" -f "name=$container_name")
        echo "✅ Running ($status)"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

echo "1. Docker Container Status:"
echo "--------------------------"
check_container "dreamer-postgres"
check_container "dreamer-redis"
check_container "dreamer-backend"
check_container "dreamer-frontend"
check_container "dreamer-traefik"
check_container "dreamer-grafana"
check_container "dreamer-portainer"
check_container "dreamer-mailhog"
check_container "dreamer-jaeger"

echo ""
echo "2. Service Health Checks:"
echo "------------------------"
check_service "Backend API" "http://localhost:3000/health"
check_service "Frontend" "http://localhost:3001"
check_service "Grafana" "http://localhost:3002"
check_service "Traefik Dashboard" "http://localhost:8080"
check_service "Portainer" "http://localhost:9000"
check_service "MailHog" "http://localhost:8025"
check_service "Jaeger UI" "http://localhost:16686"

echo ""
echo "3. Database Connectivity:"
echo "------------------------"
echo -n "PostgreSQL: "
if docker exec dreamer-postgres pg_isready -U dreamerai -d dreamerai_db > /dev/null 2>&1; then
    echo "✅ Ready"
else
    echo "❌ Not ready"
fi

echo -n "Redis: "
if docker exec dreamer-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Ready (PONG)"
else
    echo "❌ Not ready"
fi

echo ""
echo "4. Application URLs:"
echo "-------------------"
echo "🌐 Frontend:          http://localhost:3001"
echo "🔧 Backend API:       http://localhost:3000"
echo "📊 Grafana:           http://localhost:3002 (admin/admin)"
echo "🔍 Traefik:           http://localhost:8080"
echo "🐳 Portainer:         http://localhost:9000"
echo "📧 MailHog:           http://localhost:8025"
echo "🔍 Jaeger:            http://localhost:16686"
echo "📦 PostgreSQL:        localhost:5432 (dreamerai/dreamerai123)"
echo "💾 Redis:             localhost:6379"

echo ""
echo "5. Logs Access:"
echo "--------------"
echo "View all logs:        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
echo "Backend logs:         docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend"
echo "Frontend logs:        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend"

echo ""
echo "========================================="
echo "Deployment check complete!"
echo "========================================="