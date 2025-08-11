#!/bin/bash

# Setup script for Git hooks and code quality tools

echo "Setting up code quality tools and Git hooks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Install dependencies at root level
echo -e "${YELLOW}Installing root dependencies...${NC}"
npm install --save-dev \
    husky \
    lint-staged \
    @commitlint/cli \
    @commitlint/config-conventional \
    prettier \
    eslint \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    eslint-config-prettier \
    eslint-plugin-react \
    eslint-plugin-react-hooks \
    eslint-plugin-import \
    eslint-plugin-jsx-a11y \
    eslint-plugin-security \
    eslint-plugin-promise \
    eslint-plugin-unicorn \
    eslint-import-resolver-typescript \
    sort-package-json

# Initialize Husky
echo -e "${YELLOW}Initializing Husky...${NC}"
npx husky init

# Create pre-commit hook
echo -e "${YELLOW}Creating pre-commit hook...${NC}"
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Run tests for changed files
npm run test:related
EOF

chmod +x .husky/pre-commit

# Create commit-msg hook for commitlint
echo -e "${YELLOW}Creating commit-msg hook...${NC}"
cat > .husky/commit-msg << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run commitlint
npx --no-install commitlint --edit "$1"
EOF

chmod +x .husky/commit-msg

# Create pre-push hook
echo -e "${YELLOW}Creating pre-push hook...${NC}"
cat > .husky/pre-push << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests
npm test

# Check test coverage
npm run test:coverage

# Run security audit
npm audit --production
EOF

chmod +x .husky/pre-push

# Create commitlint configuration
echo -e "${YELLOW}Creating commitlint configuration...${NC}"
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
        'build'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'backend',
        'auth',
        'api',
        'ui',
        'db',
        'deps',
        'config',
        'security',
        'performance',
        'testing',
        'docs'
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always']
  }
};
EOF

# Update package.json scripts
echo -e "${YELLOW}Updating package.json scripts...${NC}"
cat > update-scripts.js << 'EOF'
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add or update scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'lint': 'eslint . --ext .js,.jsx,.ts,.tsx',
  'lint:fix': 'eslint . --ext .js,.jsx,.ts,.tsx --fix',
  'format': 'prettier --write .',
  'format:check': 'prettier --check .',
  'test': 'npm run test:frontend && npm run test:backend',
  'test:frontend': 'cd frontend && npm test',
  'test:backend': 'cd backend && npm test',
  'test:coverage': 'npm run test:coverage:frontend && npm run test:coverage:backend',
  'test:coverage:frontend': 'cd frontend && npm run test -- --coverage',
  'test:coverage:backend': 'cd backend && npm run test -- --coverage',
  'test:related': 'jest -o',
  'security:check': 'npm audit && cd frontend && npm audit && cd ../backend && npm audit',
  'prepare': 'husky',
  'validate': 'npm run lint && npm run format:check && npm run test',
  'clean': 'rm -rf node_modules frontend/node_modules backend/node_modules',
  'install:all': 'npm install && cd frontend && npm install && cd ../backend && npm install'
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('package.json scripts updated successfully!');
EOF

node update-scripts.js
rm update-scripts.js

# Install frontend ESLint dependencies
echo -e "${YELLOW}Installing frontend ESLint dependencies...${NC}"
cd frontend
npm install --save-dev \
    eslint \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    eslint-config-prettier \
    eslint-plugin-react \
    eslint-plugin-react-hooks \
    eslint-plugin-import \
    eslint-plugin-jsx-a11y \
    eslint-plugin-security \
    eslint-plugin-promise \
    eslint-plugin-unicorn \
    eslint-import-resolver-typescript

# Install backend ESLint dependencies
echo -e "${YELLOW}Installing backend ESLint dependencies...${NC}"
cd ../backend
npm install --save-dev \
    eslint \
    eslint-config-prettier \
    eslint-plugin-import \
    eslint-plugin-security \
    eslint-plugin-promise \
    eslint-plugin-unicorn \
    jest

cd ..

echo -e "${GREEN}✓ Code quality tools and Git hooks setup complete!${NC}"
echo ""
echo "Available commands:"
echo "  npm run lint          - Run ESLint"
echo "  npm run lint:fix      - Run ESLint with auto-fix"
echo "  npm run format        - Format code with Prettier"
echo "  npm run format:check  - Check code formatting"
echo "  npm run test          - Run all tests"
echo "  npm run validate      - Run all checks (lint, format, test)"
echo ""
echo "Git hooks installed:"
echo "  pre-commit  - Runs lint-staged and tests for changed files"
echo "  commit-msg  - Validates commit message format"
echo "  pre-push    - Runs full test suite and security audit"
echo ""
echo -e "${YELLOW}Note: Make sure to commit the changes to Git hooks and configuration files.${NC}"