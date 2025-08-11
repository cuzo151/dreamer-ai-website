#!/bin/bash

# Security Check Script for Dreamer AI Production Deployment
# This script performs various security checks before and after deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dreamerai.io"
API_DOMAIN="api.dreamerai.io"

echo "🔒 Dreamer AI Security Check Script"
echo "===================================="
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Initialize failed checks counter
FAILED_CHECKS=0

echo "1. Checking Dependencies Security..."
echo "------------------------------------"

# Check npm audit
echo -n "Running npm audit... "
if npm audit --production --audit-level=high 2>/dev/null | grep -q "found 0 vulnerabilities"; then
    print_status 0 "No high or critical vulnerabilities found"
else
    print_status 1 "Vulnerabilities found! Run 'npm audit' for details"
fi

# Check for outdated packages
echo -n "Checking for outdated packages... "
OUTDATED=$(npm outdated --production 2>/dev/null | wc -l)
if [ $OUTDATED -gt 1 ]; then
    print_status 1 "Found $((OUTDATED - 1)) outdated packages"
else
    print_status 0 "All packages are up to date"
fi

echo ""
echo "2. Checking Environment Configuration..."
echo "----------------------------------------"

# Check if production env file exists
if [ -f "backend/.env.production" ]; then
    print_status 0 "Production environment file exists"
    
    # Check for default values
    if grep -q "your_.*_here\|change.*in.*production\|default.*password" backend/.env.production; then
        print_status 1 "Default/placeholder values found in .env.production!"
    else
        print_status 0 "No default values detected"
    fi
    
    # Check NODE_ENV
    if grep -q "NODE_ENV=production" backend/.env.production; then
        print_status 0 "NODE_ENV is set to production"
    else
        print_status 1 "NODE_ENV is not set to production!"
    fi
else
    print_status 1 "Production environment file not found!"
fi

echo ""
echo "3. Checking SSL Configuration..."
echo "---------------------------------"

# Check if SSL certificates exist
SSL_FILES=("/etc/ssl/certs/dreamerai.io.crt" "/etc/ssl/private/dreamerai.io.key")
for file in "${SSL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "SSL file exists: $file"
    else
        print_status 1 "SSL file missing: $file"
    fi
done

# If deployed, check SSL configuration
if command -v curl &> /dev/null && [ "$DOMAIN" != "localhost" ]; then
    echo ""
    echo "4. Checking Live SSL/TLS Configuration..."
    echo "------------------------------------------"
    
    # Check SSL certificate validity
    echo -n "Checking SSL certificate... "
    if curl -s -I "https://$DOMAIN" > /dev/null 2>&1; then
        print_status 0 "SSL certificate is valid"
    else
        print_status 1 "SSL certificate check failed"
    fi
    
    # Check HSTS header
    echo -n "Checking HSTS header... "
    HSTS=$(curl -s -I "https://$DOMAIN" | grep -i "strict-transport-security")
    if [[ $HSTS == *"max-age="* ]] && [[ $HSTS == *"includeSubDomains"* ]]; then
        print_status 0 "HSTS header properly configured"
    else
        print_status 1 "HSTS header missing or misconfigured"
    fi
fi

echo ""
echo "5. Checking Security Headers..."
echo "--------------------------------"

# List of required security headers
SECURITY_HEADERS=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "Referrer-Policy"
    "Permissions-Policy"
)

if command -v curl &> /dev/null && [ "$API_DOMAIN" != "localhost" ]; then
    for header in "${SECURITY_HEADERS[@]}"; do
        echo -n "Checking $header... "
        if curl -s -I "https://$API_DOMAIN" | grep -qi "$header"; then
            print_status 0 "$header is present"
        else
            print_status 1 "$header is missing"
        fi
    done
fi

echo ""
echo "6. Checking File Permissions..."
echo "--------------------------------"

# Check for world-writable files
echo -n "Checking for world-writable files... "
WORLD_WRITABLE=$(find . -type f -perm -002 -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ $WORLD_WRITABLE -eq 0 ]; then
    print_status 0 "No world-writable files found"
else
    print_status 1 "Found $WORLD_WRITABLE world-writable files"
fi

# Check .env file permissions
if [ -f "backend/.env.production" ]; then
    echo -n "Checking .env.production permissions... "
    PERM=$(stat -c "%a" backend/.env.production 2>/dev/null || stat -f "%A" backend/.env.production)
    if [ "$PERM" = "600" ] || [ "$PERM" = "400" ]; then
        print_status 0 ".env.production has secure permissions ($PERM)"
    else
        print_status 1 ".env.production has insecure permissions ($PERM) - should be 600"
    fi
fi

echo ""
echo "7. Checking for Sensitive Data..."
echo "----------------------------------"

# Check for exposed API keys
echo -n "Checking for exposed API keys... "
if grep -r "api[_-]key\|secret[_-]key\|password" --include="*.js" --include="*.ts" --exclude-dir=node_modules --exclude-dir=.git . | grep -v ".env" | grep -q "="; then
    print_status 1 "Potential API keys or secrets found in code!"
else
    print_status 0 "No hardcoded API keys detected"
fi

# Check for console.log statements
echo -n "Checking for console.log statements... "
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.js" --include="*.ts" --exclude-dir=node_modules --exclude-dir=tests --exclude-dir=.git backend/ 2>/dev/null | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    print_status 1 "Found $CONSOLE_LOGS console.log statements in backend"
else
    print_status 0 "No console.log statements in backend"
fi

echo ""
echo "8. Checking Docker Security (if applicable)..."
echo "----------------------------------------------"

if [ -f "docker-compose.yml" ] || [ -f "Dockerfile" ]; then
    # Check if running as root in Dockerfile
    if [ -f "Dockerfile" ]; then
        echo -n "Checking Dockerfile security... "
        if grep -q "USER node\|USER [0-9]" Dockerfile; then
            print_status 0 "Dockerfile uses non-root user"
        else
            print_status 1 "Dockerfile might be running as root"
        fi
    fi
fi

echo ""
echo "9. Running Security Tests..."
echo "----------------------------"

# Run security tests if they exist
if [ -f "package.json" ] && grep -q "test:security" package.json; then
    echo "Running security test suite..."
    if npm run test:security > /dev/null 2>&1; then
        print_status 0 "Security tests passed"
    else
        print_status 1 "Security tests failed"
    fi
else
    print_status 1 "No security test suite found"
fi

echo ""
echo "========================================"
echo "Security Check Summary"
echo "========================================"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All security checks passed!${NC}"
    echo "The application appears to be ready for production deployment."
    exit 0
else
    echo -e "${RED}✗ $FAILED_CHECKS security checks failed!${NC}"
    echo "Please address the issues above before deploying to production."
    echo ""
    echo "For more information, see DEPLOYMENT_SECURITY_CHECKLIST.md"
    exit 1
fi