const compression = require('compression');
const redis = require('redis');
const crypto = require('crypto');

/**
 * Performance optimization middleware collection
 * Includes caching, compression, response optimization, and monitoring
 */

// Initialize Redis client for caching
let redisClient;
try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('Redis server connection refused');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Redis retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });
} catch (error) {
  console.warn('Redis not available for caching:', error.message);
  redisClient = null;
}

/**
 * Advanced compression middleware
 */
const advancedCompression = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  
  // Compression level (0-9, 9 being best compression but slowest)
  level: process.env.NODE_ENV === 'production' ? 6 : 1,
  
  // Don't compress if client doesn't support it
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  
  // Custom compression for different content types
  strategy: (req, res) => {
    // Use faster compression for API responses
    if (req.path.startsWith('/api/')) {
      return compression.constants.Z_FILTERED;
    }
    // Use better compression for static assets
    return compression.constants.Z_DEFAULT_STRATEGY;
  }
});

/**
 * Response caching middleware using Redis
 */
const responseCache = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
    skipCache = (req) => req.method !== 'GET' || req.headers.authorization,
    varyBy = ['Accept-Encoding', 'User-Agent']
  } = options;

  return async (req, res, next) => {
    // Skip caching if conditions met
    if (skipCache(req) || !redisClient) {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const varyKey = varyBy.map(header => req.headers[header.toLowerCase()] || '').join(':');
      const fullCacheKey = `${cacheKey}:${crypto.createHash('md5').update(varyKey).digest('hex')}`;

      // Try to get cached response
      const cached = await redisClient.get(fullCacheKey);
      if (cached) {
        const { statusCode, headers, body, timestamp } = JSON.parse(cached);
        
        // Set cache headers
        res.set(headers);
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Date': timestamp,
          'Cache-Control': `public, max-age=${ttl}`
        });

        return res.status(statusCode).send(body);
      }

      // Cache miss - intercept response
      const originalSend = res.send;
      const originalJson = res.json;

      res.send = function(body) {
        cacheResponse(fullCacheKey, res.statusCode, res.getHeaders(), body, ttl);
        res.set('X-Cache', 'MISS');
        return originalSend.call(this, body);
      };

      res.json = function(body) {
        const jsonBody = JSON.stringify(body);
        cacheResponse(fullCacheKey, res.statusCode, res.getHeaders(), jsonBody, ttl);
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache response helper
 */
async function cacheResponse(key, statusCode, headers, body, ttl) {
  if (!redisClient) return;

  try {
    const cacheData = {
      statusCode,
      headers,
      body,
      timestamp: new Date().toISOString()
    };

    await redisClient.setEx(key, ttl, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache response:', error);
  }
}

/**
 * Request/Response timing middleware
 */
const timing = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
    }
  });

  next();
};

/**
 * Database connection pooling optimization
 */
const dbOptimization = (req, res, next) => {
  // Add database query optimization context
  req.dbOptions = {
    // Use read replica for GET requests
    useReadReplica: req.method === 'GET',
    // Enable query caching for safe operations
    enableQueryCache: req.method === 'GET' && !req.headers.authorization,
    // Set connection timeout based on request type
    connectionTimeout: req.path.startsWith('/api/analytics') ? 30000 : 10000
  };

  next();
};

/**
 * Memory usage monitoring
 */
const memoryMonitoring = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const threshold = 512 * 1024 * 1024; // 512 MB

  if (memUsage.heapUsed > threshold) {
    console.warn(`High memory usage detected: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Add memory info to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.set('X-Memory-Usage', `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  }

  next();
};

/**
 * Connection pool health check
 */
const healthCheck = async (req, res, next) => {
  if (req.path !== '/health') {
    return next();
  }

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check Redis connection
  if (redisClient) {
    try {
      await redisClient.ping();
      health.services.redis = 'healthy';
    } catch (error) {
      health.services.redis = 'unhealthy';
      health.status = 'degraded';
    }
  } else {
    health.services.redis = 'not_configured';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.services.memory = {
    status: memUsage.heapUsed < 512 * 1024 * 1024 ? 'healthy' : 'warning',
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
  };

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(health);
};

/**
 * Request deduplication for identical concurrent requests
 */
const requestDeduplication = () => {
  const pendingRequests = new Map();

  return (req, res, next) => {
    // Only deduplicate GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.method}:${req.originalUrl}`;
    
    if (pendingRequests.has(key)) {
      // Wait for the pending request to complete
      pendingRequests.get(key).push({ req, res });
      return;
    }

    // This is the first request for this key
    pendingRequests.set(key, []);

    const originalSend = res.send;
    const originalJson = res.json;

    const sendToAll = (statusCode, headers, body, isJson = false) => {
      const waitingRequests = pendingRequests.get(key) || [];
      pendingRequests.delete(key);

      waitingRequests.forEach(({ res: waitingRes }) => {
        Object.entries(headers).forEach(([name, value]) => {
          waitingRes.set(name, value);
        });
        waitingRes.set('X-Request-Deduplication', 'HIT');
        waitingRes.status(statusCode);
        
        if (isJson) {
          waitingRes.json(JSON.parse(body));
        } else {
          waitingRes.send(body);
        }
      });
    };

    res.send = function(body) {
      sendToAll(this.statusCode, this.getHeaders(), body, false);
      return originalSend.call(this, body);
    };

    res.json = function(body) {
      const jsonBody = JSON.stringify(body);
      sendToAll(this.statusCode, this.getHeaders(), jsonBody, true);
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * API response pagination helper
 */
const paginationOptimization = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    offset,
    generateLinks: (total, baseUrl) => {
      const totalPages = Math.ceil(total / limit);
      const links = {};

      if (page > 1) {
        links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
        links.first = `${baseUrl}?page=1&limit=${limit}`;
      }

      if (page < totalPages) {
        links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
        links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
      }

      return {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        links
      };
    }
  };

  next();
};

/**
 * Response size optimization
 */
const responseSizeOptimization = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Remove null and undefined values from response
    const optimizedData = removeEmptyFields(data);
    
    // Add response size header in development
    if (process.env.NODE_ENV === 'development') {
      const size = JSON.stringify(optimizedData).length;
      res.set('X-Response-Size', `${size} bytes`);
    }

    return originalJson.call(this, optimizedData);
  };

  next();
};

/**
 * Remove null/undefined fields recursively
 */
function removeEmptyFields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyFields).filter(item => item !== null && item !== undefined);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      const value = removeEmptyFields(obj[key]);
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  return obj;
}

/**
 * Initialize Redis connection if available
 */
const initializeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.connect();
      console.log('Redis connected for performance caching');
    } catch (error) {
      console.warn('Redis connection failed:', error.message);
      redisClient = null;
    }
  }
};

module.exports = {
  advancedCompression,
  responseCache,
  timing,
  dbOptimization,
  memoryMonitoring,
  healthCheck,
  requestDeduplication,
  paginationOptimization,
  responseSizeOptimization,
  initializeRedis,
  redisClient
};