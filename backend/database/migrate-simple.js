const fs = require('fs').promises;
const path = require('path');

const { pool } = require('../config/database');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Run the main schema
    console.log('🚀 Setting up database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await client.query(schema);
    console.log('✅ Database schema created');

    // Run indices
    console.log('🚀 Creating database indices...');
    const indicesPath = path.join(__dirname, 'indices.sql');
    const indices = await fs.readFile(indicesPath, 'utf8');
    await client.query(indices);
    console.log('✅ Database indices created');

    // Run seed data if needed
    if (process.argv.includes('--seed')) {
      console.log('🚀 Seeding database...');
      const seedPath = path.join(__dirname, 'seed.sql');
      try {
        const seed = await fs.readFile(seedPath, 'utf8');
        await client.query(seed);
        console.log('✅ Database seeded');
      } catch {
        console.log('ℹ️  No seed file found, skipping seeding');
      }
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;