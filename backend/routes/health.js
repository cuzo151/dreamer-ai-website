const express = require('express');

const router = express.Router();
const os = require('os');

const redis = require('../config/redis');
const { pool } = require('../database');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'dreamer-ai-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Readiness check - checks if all dependencies are ready
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false
  };
  
  try {
    // Check database connection
    const dbResult = await pool.query('SELECT 1');
    checks.database = dbResult.rows.length === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  try {
    // Check Redis connection
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }
  
  const isReady = Object.values(checks).every(check => check === true);
  const status = isReady ? 200 : 503;
  
  res.status(status).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString()
  });
});

// Liveness check - checks if the service is alive
router.get('/live', (req, res) => {
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryThreshold = 0.9; // 90% threshold
  
  const isMemoryOk = (usedMemory / totalMemory) < memoryThreshold;
  const isAlive = isMemoryOk;
  
  res.status(isAlive ? 200 : 503).json({
    alive: isAlive,
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      systemUsed: usedMemory,
      systemTotal: totalMemory,
      percentUsed: `${((usedMemory / totalMemory) * 100).toFixed(2)  }%`
    },
    cpu: {
      loadAverage: os.loadavg(),
      cores: os.cpus().length
    },
    timestamp: new Date().toISOString()
  });
});

// Detailed health check with all service dependencies
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {}
  };
  
  // Database check
  try {
    const dbStart = Date.now();
    const result = await pool.query('SELECT version()');
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      version: result.rows[0].version
    };
  } catch (error) {
    health.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'degraded';
  }
  
  // Redis check
  try {
    const redisStart = Date.now();
    const pong = await redis.ping();
    const info = await redis.info('server');
    health.checks.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart,
      ping: pong,
      version: info.match(/redis_version:([^\n\r]+)/)?.[1]
    };
  } catch (error) {
    health.checks.redis = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'degraded';
  }
  
  // API endpoints check
  health.checks.endpoints = {
    auth: { available: true, path: '/api/auth' },
    users: { available: true, path: '/api/users' },
    services: { available: true, path: '/api/services' },
    bookings: { available: true, path: '/api/bookings' }
  };
  
  // System resources
  const memoryUsage = process.memoryUsage();
  health.system = {
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)  } MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)  } MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)  } MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)  } MB`
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: os.loadavg()
    },
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version
  };
  
  // Response time
  health.responseTime = `${Date.now() - startTime  } ms`;
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req, res) => {
  const metrics = [];
  
  // Basic service info
  metrics.push(`# HELP dreamer_ai_info Service information`, `# TYPE dreamer_ai_info gauge`, `dreamer_ai_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV}"} 1`, `# HELP dreamer_ai_uptime_seconds Service uptime in seconds`, `# TYPE dreamer_ai_uptime_seconds counter`);
  metrics.push(`dreamer_ai_uptime_seconds ${process.uptime()}`);
  
  // Memory metrics
  const memoryUsage = process.memoryUsage();
  metrics.push(`# HELP dreamer_ai_memory_heap_used_bytes Heap memory used`, `# TYPE dreamer_ai_memory_heap_used_bytes gauge`, `dreamer_ai_memory_heap_used_bytes ${memoryUsage.heapUsed}`, `# HELP dreamer_ai_memory_heap_total_bytes Total heap memory`, `# TYPE dreamer_ai_memory_heap_total_bytes gauge`, `dreamer_ai_memory_heap_total_bytes ${memoryUsage.heapTotal}`, `# HELP dreamer_ai_memory_rss_bytes Resident set size`, `# TYPE dreamer_ai_memory_rss_bytes gauge`, `dreamer_ai_memory_rss_bytes ${memoryUsage.rss}`);
  
  // Database connection pool metrics
  try {
    const poolMetrics = pool.totalCount !== undefined ? {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    } : { total: 0, idle: 0, waiting: 0 };
    
    metrics.push(`# HELP dreamer_ai_db_connections_total Total database connections`, `# TYPE dreamer_ai_db_connections_total gauge`, `dreamer_ai_db_connections_total ${poolMetrics.total}`, `# HELP dreamer_ai_db_connections_idle Idle database connections`, `# TYPE dreamer_ai_db_connections_idle gauge`, `dreamer_ai_db_connections_idle ${poolMetrics.idle}`, `# HELP dreamer_ai_db_connections_waiting Waiting database connections`, `# TYPE dreamer_ai_db_connections_waiting gauge`, `dreamer_ai_db_connections_waiting ${poolMetrics.waiting}`);
  } catch (error) {
    console.error('Failed to get database metrics:', error);
  }
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics.join('\n'));
});

module.exports = router;