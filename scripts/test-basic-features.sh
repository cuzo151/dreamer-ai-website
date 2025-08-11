#!/bin/bash

# Dreamer AI Website - Basic Feature Testing Script
# This script performs basic smoke tests on all major features

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "🧪 Dreamer AI Website - Basic Feature Testing"
echo "============================================="
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local url=$1
    local expected=$2
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "$expected" ]; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description (Expected: $expected, Got: $response)"
        return 1
    fi
}

# Function to test POST endpoint
test_post() {
    local url=$1
    local data=$2
    local description=$3
    
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description (HTTP $http_code)"
        echo "   Response: $body"
        return 1
    fi
}

# Track failures
FAILED=0

echo "1. Testing Basic Endpoints"
echo "--------------------------"
check_endpoint "$API_URL/health" "200" "Health check" || ((FAILED++))
check_endpoint "$API_URL/api/version" "200" "API version" || ((FAILED++))
check_endpoint "$FRONTEND_URL" "200" "Frontend loads" || ((FAILED++))

echo ""
echo "2. Testing API Endpoints"
echo "------------------------"

# Test contact form
test_post "$API_URL/api/contact/submit" \
    '{"name":"Test User","email":"test@example.com","message":"Test message","company":"Test Co"}' \
    "Contact form submission" || ((FAILED++))

# Test newsletter
test_post "$API_URL/api/newsletter/subscribe" \
    '{"email":"newsletter@example.com"}' \
    "Newsletter subscription" || ((FAILED++))

# Test services listing
check_endpoint "$API_URL/api/services" "200" "Services listing" || ((FAILED++))

# Test authentication
echo ""
echo "3. Testing Authentication"
echo "-------------------------"

# Register a test user
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"

register_response=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

if echo "$register_response" | grep -q "accessToken"; then
    echo -e "${GREEN}✓${NC} User registration"
    
    # Extract token for further tests
    ACCESS_TOKEN=$(echo "$register_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    # Test authenticated endpoint
    profile_response=$(curl -s -w "\n%{http_code}" "$API_URL/api/users/profile" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$profile_response" | tail -n1)
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✓${NC} Authenticated profile access"
    else
        echo -e "${RED}✗${NC} Authenticated profile access (HTTP $http_code)"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} User registration"
    ((FAILED++))
fi

# Test login
login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test123!@#\"}" \
    -w "\n%{http_code}")

http_code=$(echo "$login_response" | tail -n1)
if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    echo -e "${GREEN}✓${NC} User login"
else
    echo -e "${RED}✗${NC} User login (HTTP $http_code)"
    ((FAILED++))
fi

echo ""
echo "4. Testing Public Endpoints"
echo "---------------------------"
check_endpoint "$API_URL/api/case-studies" "200" "Case studies listing" || ((FAILED++))
check_endpoint "$API_URL/api/testimonials" "200" "Testimonials listing" || ((FAILED++))

echo ""
echo "5. Testing Frontend Assets"
echo "---------------------------"

# Check if key frontend assets load
check_endpoint "$FRONTEND_URL/static/js/main.js" "200" "JavaScript bundle" 2>/dev/null || \
check_endpoint "$FRONTEND_URL/static/js/bundle.js" "200" "JavaScript bundle" 2>/dev/null || \
echo -e "${YELLOW}⚠${NC} JavaScript bundle (might be using different name in production)"

check_endpoint "$FRONTEND_URL/static/css/main.css" "200" "CSS styles" 2>/dev/null || \
check_endpoint "$FRONTEND_URL/static/css/styles.css" "200" "CSS styles" 2>/dev/null || \
echo -e "${YELLOW}⚠${NC} CSS styles (might be using different name in production)"

echo ""
echo "6. Testing Rate Limiting"
echo "------------------------"

# Make multiple rapid requests to test rate limiting
echo -n "Testing rate limiting... "
for i in {1..10}; do
    curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"wrong@example.com","password":"wrong"}' \
        -o /dev/null
done

# The 11th request should be rate limited
rate_limit_response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@example.com","password":"wrong"}')

if [ "$rate_limit_response" == "429" ]; then
    echo -e "${GREEN}✓${NC} Rate limiting is working"
else
    echo -e "${YELLOW}⚠${NC} Rate limiting might not be configured (Expected 429, got $rate_limit_response)"
fi

echo ""
echo "============================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED tests failed${NC}"
    echo ""
    echo "Please review the failed tests above and fix any issues before deployment."
    exit 1
fi