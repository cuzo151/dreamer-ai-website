const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const RedisStore = require('rate-limit-redis');

const { APIErrors } = require('./validation');

// Redis client for distributed rate limiting
const redisClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL)
  : null;

/**
 * Token bucket implementation for more sophisticated rate limiting
 */
class TokenBucket {
  constructor(capacity, refillRate, refillAmount = 1) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // milliseconds
    this.refillAmount = refillAmount;
    this.lastRefill = Date.now();
  }

  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillRate) * this.refillAmount;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  getTokens() {
    this.refill();
    return this.tokens;
  }
}

/**
 * Create rate limiter with Redis store for distributed systems
 */
const createRateLimiter = (options = {}) => {
  const config = {
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      const error = APIErrors.RateLimit(retryAfter, req.originalUrl);
      
      res.set('Retry-After', retryAfter);
      res.status(error.status).json(error.toJSON());
    },
    skip: options.skip,
    keyGenerator: options.keyGenerator || ((req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.id || req.ip;
    })
  };

  // Use Redis store if available for distributed rate limiting
  if (redisClient) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: options.prefix || 'rl:',
      sendCommand: (...args) => redisClient.send_command(...args)
    });
  }

  return rateLimit(config);
};

/**
 * Rate limiters for different endpoints
 */
const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    prefix: 'rl:auth:',
    message: 'Too many authentication attempts'
  }),

  // Standard API rate limit
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    prefix: 'rl:api:',
    skip: (req) => req.user?.role === 'admin' || req.user?.role === 'super_admin'
  }),

  // Lenient rate limit for read operations
  read: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    prefix: 'rl:read:'
  }),

  // Strict rate limit for write operations
  write: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    prefix: 'rl:write:'
  }),

  // Very strict rate limit for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    prefix: 'rl:sensitive:'
  }),

  // AI/Chat endpoints with token-based limits
  ai: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    prefix: 'rl:ai:',
    keyGenerator: (req) => req.user?.id || req.ip
  }),

  // File upload rate limit
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    prefix: 'rl:upload:'
  }),

  // Newsletter subscription
  newsletter: createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    prefix: 'rl:newsletter:',
    keyGenerator: (req) => req.body?.email || req.ip
  })
};

/**
 * Dynamic rate limiter based on user tier
 */
const dynamicRateLimiter = (req, res, next) => {
  const userTier = req.user?.tier || 'anonymous';
  
  const limits = {
    anonymous: { windowMs: 15 * 60 * 1000, max: 100 },
    free: { windowMs: 15 * 60 * 1000, max: 1000 },
    premium: { windowMs: 15 * 60 * 1000, max: 5000 },
    enterprise: { windowMs: 15 * 60 * 1000, max: 50000 }
  };

  const limiter = createRateLimiter({
    ...limits[userTier],
    prefix: `rl:tier:${userTier}:`
  });

  limiter(req, res, next);
};

/**
 * Token bucket rate limiter for more sophisticated control
 */
const tokenBuckets = new Map();

const tokenBucketLimiter = (options = {}) => {
  const {
    capacity = 10,
    refillRate = 60000, // 1 minute
    refillAmount = 1,
    tokensPerRequest = 1
  } = options;

  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    
    if (!tokenBuckets.has(key)) {
      tokenBuckets.set(key, new TokenBucket(capacity, refillRate, refillAmount));
    }

    const bucket = tokenBuckets.get(key);
    const hasTokens = bucket.consume(tokensPerRequest);
    const remainingTokens = bucket.getTokens();

    // Set headers
    res.set('X-RateLimit-Limit', capacity);
    res.set('X-RateLimit-Remaining', remainingTokens);
    res.set('X-RateLimit-Reset', new Date(Date.now() + refillRate).toISOString());

    if (!hasTokens) {
      const error = APIErrors.RateLimit(
        Math.ceil(refillRate / 1000),
        req.originalUrl
      );
      return res.status(error.status).json(error.toJSON());
    }

    next();
  };
};

/**
 * Sliding window rate limiter
 */
const slidingWindowLimiter = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    max = 10
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    // Remove old requests outside the window
    const userRequests = requests.get(key).filter(time => time > windowStart);
    
    if (userRequests.length >= max) {
      const oldestRequest = Math.min(...userRequests);
      const resetTime = oldestRequest + windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      const error = APIErrors.RateLimit(retryAfter, req.originalUrl);
      
      res.set('Retry-After', retryAfter);
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
      
      return res.status(error.status).json(error.toJSON());
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', max - userRequests.length);

    next();
  };
};

/**
 * Cleanup old token buckets periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, bucket] of tokenBuckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      tokenBuckets.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

/**
 * Express middleware to add rate limit info to all responses
 */
const rateLimitInfo = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Add rate limit info to response headers if available
    if (req.rateLimit) {
      res.set('X-RateLimit-Limit', req.rateLimit.limit);
      res.set('X-RateLimit-Remaining', req.rateLimit.remaining);
      res.set('X-RateLimit-Reset', new Date(req.rateLimit.resetTime).toISOString());
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  createRateLimiter,
  rateLimiters,
  dynamicRateLimiter,
  tokenBucketLimiter,
  slidingWindowLimiter,
  rateLimitInfo,
  TokenBucket
};