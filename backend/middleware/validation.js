const { validationResult } = require('express-validator');

/**
 * Standard error response formatter following RFC 7807
 */
class APIError extends Error {
  constructor(type, title, status, detail, instance = null, errors = null) {
    super(detail);
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail;
    this.instance = instance;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    this.requestId = this.generateRequestId();
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  toJSON() {
    const response = {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      timestamp: this.timestamp,
      request_id: this.requestId
    };

    if (this.instance) {
      response.instance = this.instance;
    }

    if (this.errors) {
      response.errors = this.errors;
    }

    return response;
  }
}

/**
 * Common API errors
 */
const APIErrors = {
  ValidationError: (detail, errors, instance) => new APIError(
    'https://api.dreamerai.io/errors/validation-error',
    'Validation Error',
    400,
    detail,
    instance,
    errors
  ),

  NotFound: (resource, instance) => new APIError(
    'https://api.dreamerai.io/errors/not-found',
    'Resource Not Found',
    404,
    `The requested ${resource} was not found`,
    instance
  ),

  Unauthorized: (detail, instance) => new APIError(
    'https://api.dreamerai.io/errors/unauthorized',
    'Unauthorized',
    401,
    detail || 'Authentication is required to access this resource',
    instance
  ),

  Forbidden: (detail, instance) => new APIError(
    'https://api.dreamerai.io/errors/forbidden',
    'Forbidden',
    403,
    detail || 'You do not have permission to access this resource',
    instance
  ),

  Conflict: (detail, instance) => new APIError(
    'https://api.dreamerai.io/errors/conflict',
    'Conflict',
    409,
    detail,
    instance
  ),

  RateLimit: (retryAfter, instance) => new APIError(
    'https://api.dreamerai.io/errors/rate-limit',
    'Rate Limit Exceeded',
    429,
    `You have exceeded the rate limit. Please try again in ${retryAfter} seconds`,
    instance
  ),

  ServerError: (detail, instance) => new APIError(
    'https://api.dreamerai.io/errors/server-error',
    'Internal Server Error',
    500,
    detail || 'An unexpected error occurred. Please try again later.',
    instance
  ),

  BadRequest: (detail, instance) => new APIError(
    'https://api.dreamerai.io/errors/bad-request',
    'Bad Request',
    400,
    detail,
    instance
  ),

  MethodNotAllowed: (method, allowedMethods, instance) => new APIError(
    'https://api.dreamerai.io/errors/method-not-allowed',
    'Method Not Allowed',
    405,
    `The ${method} method is not allowed for this resource. Allowed methods: ${allowedMethods.join(', ')}`,
    instance
  ),

  PayloadTooLarge: (maxSize, instance) => new APIError(
    'https://api.dreamerai.io/errors/payload-too-large',
    'Payload Too Large',
    413,
    `Request payload exceeds the maximum allowed size of ${maxSize}`,
    instance
  ),

  ServiceUnavailable: (detail, instance) => new APIError(
    'https://api.dreamerai.io/errors/service-unavailable',
    'Service Unavailable',
    503,
    detail || 'The service is temporarily unavailable. Please try again later.',
    instance
  )
};

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      code: 'VALIDATION_ERROR',
      value: err.value
    }));

    const error = new APIErrors.ValidationError(
      'Invalid input data provided',
      formattedErrors,
      req.originalUrl
    );

    return res.status(error.status).json(error.toJSON());
  }
  next();
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for monitoring
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // Handle known API errors
  if (err instanceof APIError) {
    return res.status(err.status).json(err.toJSON());
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message,
      code: 'VALIDATION_ERROR'
    }));

    const error = new APIErrors.ValidationError(
      'Validation failed',
      errors,
      req.originalUrl
    );

    return res.status(error.status).json(error.toJSON());
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const error = APIErrors.Conflict(
      `A resource with this ${field} already exists`,
      req.originalUrl
    );

    return res.status(error.status).json(error.toJSON());
  }

  // Default to 500 server error
  const error = new APIErrors.ServerError(
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message,
    req.originalUrl
  );

  res.status(error.status).json(error.toJSON());
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
  const error = APIErrors.NotFound('endpoint', req.originalUrl);
  res.status(error.status).json(error.toJSON());
};

/**
 * Request ID middleware
 */
const requestIdMiddleware = (req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Response time middleware
 */
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

/**
 * Sanitize input middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    sanitizeObject(req.body);
  }

  next();
};

/**
 * Pagination middleware
 */
const paginationMiddleware = (defaultLimit = 20, maxLimit = 100) => {
  return (req, res, next) => {
    const page = Math.max(1, Number.parseInt(req.query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(req.query.limit) || defaultLimit));
    const offset = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      offset
    };

    // Helper function to generate pagination response
    res.paginate = (total, data) => {
      const totalPages = Math.ceil(total / limit);
      const hasMore = page < totalPages;

      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const queryParams = { ...req.query, limit };

      const links = {
        first: `${baseUrl}?${new URLSearchParams({ ...queryParams, page: 1 })}`,
        last: `${baseUrl}?${new URLSearchParams({ ...queryParams, page: totalPages })}`
      };

      if (page > 1) {
        links.prev = `${baseUrl}?${new URLSearchParams({ ...queryParams, page: page - 1 })}`;
      }

      if (hasMore) {
        links.next = `${baseUrl}?${new URLSearchParams({ ...queryParams, page: page + 1 })}`;
      }

      return {
        success: true,
        data,
        pagination: {
          page,
          per_page: limit,
          total,
          total_pages: totalPages,
          has_more: hasMore
        },
        links,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          request_id: req.id
        }
      };
    };

    next();
  };
};

/**
 * CORS options for specific origins
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

module.exports = {
  APIError,
  APIErrors,
  handleValidationErrors,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  responseTimeMiddleware,
  sanitizeInput,
  paginationMiddleware,
  corsOptions
};