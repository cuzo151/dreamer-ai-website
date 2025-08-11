const redis = require('redis');

const { logger } = require('../middleware/logging');

// Create Redis client
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Too many Redis reconnection attempts');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Handle connection events
client.on('connect', () => {
  logger.info('✅ Connected to Redis');
});

client.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

// Connect to Redis
(async () => {
  try {
    await client.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.quit();
});

process.on('SIGTERM', async () => {
  await client.quit();
});

module.exports = client;