const { Client } = require('pg');

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // Connect to PostgreSQL without specifying a database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'dreamer_ai';
    
    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`ℹ️  Database ${dbName} already exists`);
    }

    await client.end();

    // Connect to the new database
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    await dbClient.connect();
    console.log(`✅ Connected to database: ${dbName}`);

    // Run schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    await dbClient.query(schema);
    console.log('✅ Database schema created');

    // Create indices
    const indicesPath = path.join(__dirname, 'indices.sql');
    try {
      const indices = await fs.readFile(indicesPath, 'utf8');
      await dbClient.query(indices);
      console.log('✅ Database indices created');
    } catch {
      console.log('ℹ️  No indices.sql file found, skipping indices creation');
    }

    await dbClient.end();
    console.log('✅ Database setup complete!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;