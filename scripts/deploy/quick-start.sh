claude
#!/bin/bash

# Quick start script for Dreamer AI development environment
# This provides a simple way to get started quickly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Dreamer AI Solutions - Quick Start${NC}"
echo "===================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose is not installed${NC}"
    echo "Docker Compose should come with Docker Desktop"
    exit 1
fi

# Start Docker if not running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting Docker...${NC}"
    open -a Docker || echo "Please start Docker Desktop manually"
    echo "Waiting for Docker to start..."
    while ! docker info > /dev/null 2>&1; do
        sleep 1
    done
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Run the main deployment script
cd "$SCRIPT_DIR"
./dev-deploy.sh setup
./dev-deploy.sh -p monitoring start

echo ""
echo -e "${GREEN}🎉 Quick start complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your /etc/hosts file (see instructions above)"
echo "2. Import the Root CA certificate to your browser"
echo "3. Update .env file with your API keys"
echo "4. Access the application at https://dreamer.local"
echo ""
echo "Useful commands:"
echo "  ./scripts/deploy/dev-deploy.sh status     # Check status"
echo "  ./scripts/deploy/dev-deploy.sh logs -f    # View logs"
echo "  ./scripts/deploy/dev-deploy.sh stop       # Stop services"
echo "  ./scripts/deploy/dev-deploy.sh restart    # Restart services"