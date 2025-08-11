const { Pool } = require('pg');

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${sqlFiles.length} migration files`);

    // Check which migrations have been run
    const executedResult = await pool.query('SELECT filename FROM migrations');
    const executed = new Set(executedResult.rows.map(r => r.filename));

    // Run pending migrations
    let migrationsRun = 0;
    for (const file of sqlFiles) {
      if (!executed.has(file)) {
        console.log(`Running migration: ${file}`);
        
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Run migration in a transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`✓ Migration ${file} completed successfully`);
          migrationsRun++;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    }

    if (migrationsRun === 0) {
      console.log('All migrations are up to date');
    } else {
      console.log(`\n✓ Successfully ran ${migrationsRun} migration(s)`);
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(console.error);