const { Client } = require('pg');

const createTestDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    
    // Drop database if exists
    await client.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    
    // Create test database
    await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    
    console.info(`Test database ${process.env.DB_NAME} created successfully`);
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  } finally {
    await client.end();
  }
};

const dropTestDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();
    
    // Terminate connections to test database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${process.env.DB_NAME}'
        AND pid <> pg_backend_pid()
    `);
    
    // Drop test database
    await client.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    
    console.info(`Test database ${process.env.DB_NAME} dropped successfully`);
  } catch (error) {
    console.error('Error dropping test database:', error);
  } finally {
    await client.end();
  }
};

const clearDatabase = async (pool) => {
  const tables = [
    'user_verifications',
    'sessions',
    'api_keys',
    'user_projects',
    'user_preferences',
    'users',
    'projects',
    'logs'
  ];

  try {
    await pool.query('BEGIN');
    
    // Disable foreign key checks
    await pool.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Clear all tables
    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
    
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

module.exports = {
  createTestDatabase,
  dropTestDatabase,
  clearDatabase
};