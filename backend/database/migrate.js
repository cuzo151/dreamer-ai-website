const fs = require('fs').promises;
const path = require('path');

const { Pool } = require('pg');
require('dotenv').config();

class DatabaseMigrator {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  async init() {
    // Create migrations table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      )
    `);
  }

  async getMigrationFiles() {
    const files = await fs.readdir(this.migrationsDir);
    return files
      .filter(f => f.endsWith('.sql'))
      .sort();
  }

  async getExecutedMigrations() {
    const result = await this.pool.query(
      'SELECT filename, checksum FROM migrations WHERE success = TRUE ORDER BY filename'
    );
    return result.rows;
  }

  async calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async executeMigration(filename) {
    const startTime = Date.now();
    const filepath = path.join(this.migrationsDir, filename);
    const content = await fs.readFile(filepath, 'utf8');
    const checksum = await this.calculateChecksum(content);

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if migration was already executed
      const existing = await client.query(
        'SELECT id, checksum FROM migrations WHERE filename = $1',
        [filename]
      );
      
      if (existing.rows.length > 0) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`Migration ${filename} has been modified since last execution!`);
        }
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        await client.query('COMMIT');
        return;
      }
      
      console.log(`🚀 Executing ${filename}...`);
      
      // Execute migration
      await client.query(content);
      
      // Record successful migration
      const executionTime = Date.now() - startTime;
      await client.query(`
        INSERT INTO migrations (filename, checksum, execution_time_ms, success)
        VALUES ($1, $2, $3, TRUE)
      `, [filename, checksum, executionTime]);
      
      await client.query('COMMIT');
      console.log(`✅ ${filename} executed successfully (${executionTime}ms)`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Record failed migration
      await client.query(`
        INSERT INTO migrations (filename, checksum, execution_time_ms, success, error_message)
        VALUES ($1, $2, $3, FALSE, $4)
        ON CONFLICT (filename) DO UPDATE
        SET error_message = $4, executed_at = CURRENT_TIMESTAMP
      `, [filename, checksum, Date.now() - startTime, error.message]);
      
      console.error(`❌ ${filename} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollback(filename) {
    const rollbackFile = filename.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(this.migrationsDir, rollbackFile);
    
    try {
      const content = await fs.readFile(rollbackPath, 'utf8');
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        await client.query(content);
        await client.query('DELETE FROM migrations WHERE filename = $1', [filename]);
        await client.query('COMMIT');
        console.log(`⏪ Rolled back ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ No rollback file found for ${filename}`);
      } else {
        console.error(`❌ Rollback failed for ${filename}:`, error.message);
      }
      throw error;
    }
  }

  async run() {
    try {
      await this.init();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      const executedFilenames = new Set(executedMigrations.map(m => m.filename));
      
      const pendingMigrations = migrationFiles.filter(
        f => !executedFilenames.has(f)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✨ Database is up to date!');
        return;
      }
      
      console.log(`📦 Found ${pendingMigrations.length} pending migration(s)`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('🎉 All migrations completed successfully!');
      
    } catch (error) {
      console.error('💥 Migration failed:', error.message);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }

  async status() {
    try {
      await this.init();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      console.log('\n📊 Migration Status:\n');
      console.log('File                          | Status    | Executed At');
      console.log('------------------------------|-----------|------------------------');
      
      for (const file of migrationFiles) {
        const executed = executedMigrations.find(m => m.filename === file);
        if (executed) {
          const result = await this.pool.query(
            'SELECT executed_at FROM migrations WHERE filename = $1 AND success = TRUE',
            [file]
          );
          const executedAt = result.rows[0]?.executed_at;
          console.log(
            `${file.padEnd(30)} | ✅ Done   | ${executedAt ? new Date(executedAt).toISOString() : 'Unknown'}`
          );
        } else {
          console.log(`${file.padEnd(30)} | ⏳ Pending | -`);
        }
      }
      
    } catch (error) {
      console.error('Error checking status:', error.message);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }
}

// CLI handling
const command = process.argv[2];
const migrator = new DatabaseMigrator();

switch (command) {
  case 'up':
  case 'migrate':
    migrator.run();
    break;
  case 'status':
    migrator.status();
    break;
  case 'rollback':
    const filename = process.argv[3];
    if (!filename) {
      console.error('Please specify a migration file to rollback');
      process.exit(1);
    }
    migrator.rollback(filename);
    break;
  default:
    console.log(`
Database Migration Tool

Commands:
  npm run migrate           Run all pending migrations
  npm run migrate:status    Show migration status
  npm run migrate:rollback  <filename> Rollback a specific migration

Examples:
  npm run migrate
  npm run migrate:status
  npm run migrate:rollback 001_initial_schema.sql
    `);
    process.exit(0);
}

module.exports = DatabaseMigrator;