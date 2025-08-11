const { logger } = require('../middleware/logging');
require('dotenv').config();

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';
const envConfig = require(`./environments/${env}`);

// Merge with environment variables
const config = {
  ...envConfig,
  env,
  isProduction: env === 'production',
  isDevelopment: env === 'development',
  isTest: env === 'test',
  
  // Override with environment variables if present
  server: {
    ...envConfig.server,
    port: process.env.PORT || envConfig.server.port
  },
  
  database: {
    ...envConfig.database,
    connectionString: process.env.DATABASE_URL || 
      `postgresql://${envConfig.database.user}:${envConfig.database.password}@${envConfig.database.host}:${envConfig.database.port}/${envConfig.database.database}`
  },
  
  redis: {
    ...envConfig.redis,
    url: process.env.REDIS_URL || 
      `redis://:${envConfig.redis.password}@${envConfig.redis.host}:${envConfig.redis.port}`
  }
};

// Validate required configuration
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'REDIS_URL'
];

if (config.isProduction) {
  requiredEnvVars.push('OPENAI_API_KEY', 'ANTHROPIC_API_KEY');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && config.isProduction) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

module.exports = config;