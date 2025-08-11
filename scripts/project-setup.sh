#!/bin/bash

# Dreamer AI Solutions - Project Setup Script
# This script initializes the development environment for all team members

set -e

echo "🚀 Setting up Dreamer AI Solutions Development Environment..."

# Check for required tools
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed. Aborting." >&2; exit 1; }

# Create necessary directories
echo "📁 Creating project structure..."
mkdir -p frontend/src/{components,services,utils,hooks,contexts,types}
mkdir -p backend/{routes,middleware,controllers,models,utils,config}
mkdir -p backend/database/{migrations,seeds}
mkdir -p k8s/{base,overlays/{dev,staging,prod}}
mkdir -p terraform/{modules,environments}
mkdir -p scripts
mkdir -p docs

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment files
echo "🔐 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "⚠️  No .env.example found, please create .env manually"
fi

if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dreamer_ai
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Encryption
MASTER_ENCRYPTION_KEY=$(openssl rand -base64 32)
PASSWORD_PEPPER=$(openssl rand -base64 16)

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
API_PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (optional)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EOF
    echo "✅ Created backend/.env - Please update with your actual values"
fi

# Setup Git hooks
echo "🪝 Setting up Git hooks..."
npm run setup:hooks

# Initialize database
echo "🗄️ Setting up database..."
if command -v psql >/dev/null 2>&1; then
    echo "Creating database if not exists..."
    psql -U postgres -c "CREATE DATABASE dreamer_ai;" 2>/dev/null || echo "Database might already exist"
    
    # Run migrations
    cd backend && npm run db:migrate && cd ..
else
    echo "⚠️  PostgreSQL not found. Please install and run: npm run db:setup"
fi

# Build frontend
echo "🏗️ Building frontend..."
cd frontend && npm install && npm run build && cd ..

# Setup pre-commit hooks
echo "🔧 Configuring pre-commit hooks..."
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/commit-msg "npx commitlint --edit $1"

# Create initial admin user
echo "👤 Creating initial admin user..."
cd backend && npm run seed:admin 2>/dev/null || echo "⚠️  Admin user creation skipped" && cd ..

# Run initial tests
echo "🧪 Running initial tests..."
npm run test:all || echo "⚠️  Some tests failed - please check"

# Generate documentation
echo "📚 Generating documentation..."
npm run docs:generate 2>/dev/null || echo "⚠️  Documentation generation skipped"

echo "
✅ Setup Complete!

📋 Next Steps:
1. Update backend/.env with your database credentials
2. Run 'npm run dev' to start the development servers
3. Access the application at http://localhost:3000
4. Access the API at http://localhost:3001

🛠️ Useful Commands:
- npm run dev          : Start development servers
- npm run test         : Run all tests
- npm run lint         : Check code quality
- npm run build        : Build for production
- npm run deploy:dev   : Deploy to development

📖 Documentation:
- Architecture: docs/ARCHITECTURE.md
- API: docs/API.md
- Security: SECURITY_FRAMEWORK.md
- Contributing: docs/CONTRIBUTING.md

Happy coding! 🎉
"