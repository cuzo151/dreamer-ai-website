const request = require('supertest');

const app = require('../server');

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    // Setup successful mock responses for health checks
    global.mockDatabase.pool.query.mockResolvedValue({ rows: [{ value: 1 }], rowCount: 1 });
    global.mockDatabase.redis.ping.mockResolvedValue('PONG');
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('service', 'dreamer-ai-backend');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 when all services are ready', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);
      
      expect(response.body).toHaveProperty('ready', true);
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database', true);
      expect(response.body.checks).toHaveProperty('redis', true);
    });

    it('should return 503 when database is not ready', async () => {
      // Mock database failure
      global.mockDatabase.pool.query.mockRejectedValue(new Error('Database connection failed'));
      
      const response = await request(app)
        .get('/health/ready')
        .expect(503);
      
      expect(response.body).toHaveProperty('ready', false);
      expect(response.body.checks).toHaveProperty('database', false);
    });

    it('should return 503 when redis is not ready', async () => {
      // Mock redis failure
      global.mockDatabase.redis.ping.mockRejectedValue(new Error('Redis connection failed'));
      
      const response = await request(app)
        .get('/health/ready')
        .expect(503);
      
      expect(response.body).toHaveProperty('ready', false);
      expect(response.body.checks).toHaveProperty('redis', false);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness check status', async () => {
      const response = await request(app)
        .get('/health/live');
      
      // Accept either 200 or 503 as valid responses for liveness
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('alive');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      
      // If memory usage is high in test environment, alive should be false
      if (response.status === 503) {
        expect(response.body.alive).toBe(false);
      } else {
        expect(response.body.alive).toBe(true);
      }
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      // Mock database version response
      global.mockDatabase.pool.query.mockResolvedValue({ 
        rows: [{ version: 'PostgreSQL 14.0' }] 
      });
      
      // Mock redis info response
      global.mockDatabase.redis.info.mockResolvedValue('redis_version:6.2.6\n');
      
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks.database).toHaveProperty('status', 'healthy');
      expect(response.body.checks.redis).toHaveProperty('status', 'healthy');
    });

    it('should return degraded status when database fails', async () => {
      // Mock database failure
      global.mockDatabase.pool.query.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/health/detailed')
        .expect(503);
      
      expect(response.body).toHaveProperty('status', 'degraded');
      expect(response.body.checks.database).toHaveProperty('status', 'unhealthy');
    });
  });

  describe('GET /health/metrics', () => {
    it('should return prometheus metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);
      
      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(response.text).toContain('dreamer_ai_uptime_seconds');
      expect(response.text).toContain('dreamer_ai_memory_heap_used_bytes');
    });
  });
});