#!/bin/bash

# Dreamer AI Solutions Database Setup Script
# This script sets up the PostgreSQL database for the application

echo "==================================="
echo "Dreamer AI Database Setup"
echo "==================================="

# Configuration
DB_NAME="dreamer_ai"
DB_USER="dreamer_app"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Prompt for database password
echo -n "Enter password for database user '$DB_USER': "
read -s DB_PASSWORD
echo

# Create .env file if it doesn't exist
if [ ! -f "../../.env" ]; then
    echo "Creating .env file..."
    cat > ../../.env << EOF
# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Security
JWT_SECRET="$(openssl rand -base64 32)"
BCRYPT_ROUNDS=10

# API Keys (update with your actual keys)
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
    echo ".env file created. Please update with your API keys."
fi

# Create database and user
echo "Creating database and user..."
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# Run schema migration
echo "Running schema migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql

if [ $? -eq 0 ]; then
    echo "Schema created successfully!"
else
    echo "Error creating schema. Please check the error messages above."
    exit 1
fi

# Ask if user wants to seed data
echo -n "Do you want to seed the database with sample data? (y/n): "
read SEED_DATA

if [ "$SEED_DATA" = "y" ] || [ "$SEED_DATA" = "Y" ]; then
    echo "Seeding database..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed.sql
    
    if [ $? -eq 0 ]; then
        echo "Database seeded successfully!"
        echo ""
        echo "Default admin credentials:"
        echo "Email: admin@dreamerai.io"
        echo "Password: Admin123!"
        echo ""
        echo "Test client credentials:"
        echo "Email: john.doe@techcorp.com"
        echo "Password: Client123!"
    else
        echo "Error seeding database. Please check the error messages above."
    fi
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd ../..
npm install pg bcryptjs jsonwebtoken dotenv

# Create database backup directory
mkdir -p database/backups

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Update the .env file with your API keys"
echo "2. Start the backend server: npm run dev"
echo "3. The database is ready to use!"
echo ""
echo "Database connection string:"
echo "postgresql://${DB_USER}:****@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""