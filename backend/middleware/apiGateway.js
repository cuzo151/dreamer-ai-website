const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');

/**
 * API Gateway Middleware for Widget Integrations
 * Provides centralized authentication, rate limiting, and request/response transformation
 */
class APIGateway {
  constructor() {
    this.widgetKeys = new Map(); // In production, use Redis or database
    this.transformers = new Map();
    this.rateLimiters = new Map();
    this.apiVersions = ['v1', 'v2']; // Supported API versions
  }

  /**
   * Initialize widget API key
   */
  generateWidgetKey(clientId, domain, permissions = []) {
    const keyId = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString('hex');
    
    const widgetKey = {
      keyId,
      secret,
      clientId,
      domain,
      permissions,
      createdAt: new Date(),
      isActive: true,
      rateLimits: {
        requests: 1000, // requests per hour
        burst: 50 // burst requests per minute
      }
    };

    this.widgetKeys.set(keyId, widgetKey);
    
    // Generate JWT token for the widget
    const token = jwt.sign(
      {
        keyId,
        clientId,
        domain,
        permissions,
        type: 'widget'
      },
      process.env.WIDGET_JWT_SECRET || 'widget-secret-change-in-production',
      { expiresIn: '1y' }
    );

    return {
      keyId,
      token,
      domain,
      permissions,
      rateLimits: widgetKey.rateLimits
    };
  }

  /**
   * Validate widget authentication
   */
  validateWidget(req, res, next) {
    try {
      // Check for API key in multiple places
      const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.query.api_key;

      if (!apiKey) {
        return res.status(401).json({
          type: 'https://api.dreamerai.io/errors/widget-auth-required',
          title: 'Widget Authentication Required',
          status: 401,
          detail: 'API key is required for widget access',
          instance: req.originalUrl
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(
        apiKey, 
        process.env.WIDGET_JWT_SECRET || 'widget-secret-change-in-production'
      );

      if (decoded.type !== 'widget') {
        throw new Error('Invalid token type');
      }

      // Validate origin domain (for CORS-like protection)
      const origin = req.headers.origin || req.headers.referer;
      if (origin && !this.validateOrigin(origin, decoded.domain)) {
        return res.status(403).json({
          type: 'https://api.dreamerai.io/errors/invalid-origin',
          title: 'Invalid Origin',
          status: 403,
          detail: `Request origin ${origin} is not allowed for this widget`,
          instance: req.originalUrl
        });
      }

      // Attach widget info to request
      req.widget = {
        keyId: decoded.keyId,
        clientId: decoded.clientId,
        domain: decoded.domain,
        permissions: decoded.permissions || []
      };

      next();
    } catch (error) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/widget-auth-failed',
        title: 'Widget Authentication Failed',
        status: 401,
        detail: error.message,
        instance: req.originalUrl
      });
    }
  }

  /**
   * Check widget permissions
   */
  checkPermission(requiredPermission) {
    return (req, res, next) => {
      if (!req.widget) {
        return res.status(401).json({
          type: 'https://api.dreamerai.io/errors/widget-auth-required',
          title: 'Widget Authentication Required',
          status: 401,
          detail: 'Widget authentication is required',
          instance: req.originalUrl
        });
      }

      const hasPermission = req.widget.permissions.includes(requiredPermission) ||
                           req.widget.permissions.includes('*');

      if (!hasPermission) {
        return res.status(403).json({
          type: 'https://api.dreamerai.io/errors/insufficient-permissions',
          title: 'Insufficient Permissions',
          status: 403,
          detail: `Widget requires '${requiredPermission}' permission`,
          instance: req.originalUrl
        });
      }

      next();
    };
  }

  /**
   * Validate origin domain
   */
  validateOrigin(origin, allowedDomain) {
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(allowedDomain.startsWith('http') ? allowedDomain : `https://${allowedDomain}`);
      
      // Allow exact domain match or subdomain match
      return originUrl.hostname === allowedUrl.hostname ||
             originUrl.hostname.endsWith(`.${allowedUrl.hostname}`);
    } catch (error) {
      return false;
    }
  }

  /**
   * API versioning middleware
   */
  versionHandler(req, res, next) {
    // Extract version from URL path or header
    const pathVersion = req.path.match(/^\/api\/v(\d+)\//)?.[1];
    const headerVersion = req.headers['api-version'];
    const queryVersion = req.query.version;

    const version = pathVersion || headerVersion || queryVersion || '1';

    if (!this.apiVersions.includes(`v${version}`)) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/unsupported-version',
        title: 'Unsupported API Version',
        status: 400,
        detail: `API version v${version} is not supported`,
        supportedVersions: this.apiVersions,
        instance: req.originalUrl
      });
    }

    req.apiVersion = `v${version}`;
    next();
  }

  /**
   * Request/Response transformer
   */
  createTransformer(transformType, transformer) {
    this.transformers.set(transformType, transformer);
  }

  /**
   * Apply request transformation
   */
  transformRequest(transformType) {
    return (req, res, next) => {
      const transformer = this.transformers.get(transformType);
      if (transformer && transformer.request) {
        try {
          req.body = transformer.request(req.body, req.apiVersion, req.widget);
        } catch (error) {
          return res.status(400).json({
            type: 'https://api.dreamerai.io/errors/transformation-error',
            title: 'Request Transformation Error',
            status: 400,
            detail: error.message,
            instance: req.originalUrl
          });
        }
      }
      next();
    };
  }

  /**
   * Apply response transformation
   */
  transformResponse(transformType) {
    return (req, res, next) => {
      const transformer = this.transformers.get(transformType);
      if (transformer && transformer.response) {
        const originalJson = res.json;
        res.json = function(data) {
          try {
            const transformedData = transformer.response(data, req.apiVersion, req.widget);
            return originalJson.call(this, transformedData);
          } catch (error) {
            return originalJson.call(this, {
              type: 'https://api.dreamerai.io/errors/transformation-error',
              title: 'Response Transformation Error',
              status: 500,
              detail: error.message
            });
          }
        };
      }
      next();
    };
  }

  /**
   * Widget-specific rate limiting
   */
  createWidgetRateLimit(config = {}) {
    return rateLimit({
      windowMs: config.windowMs || 60 * 60 * 1000, // 1 hour
      max: (req) => {
        if (req.widget) {
          const widgetConfig = this.widgetKeys.get(req.widget.keyId);
          return widgetConfig?.rateLimits?.requests || config.max || 1000;
        }
        return config.max || 100; // Default for non-widget requests
      },
      keyGenerator: (req) => {
        return req.widget ? `widget_${req.widget.keyId}` : req.ip;
      },
      message: (req) => ({
        type: 'https://api.dreamerai.io/errors/rate-limit',
        title: 'Widget Rate Limit Exceeded',
        status: 429,
        detail: `Widget has exceeded its rate limit`,
        retryAfter: Math.ceil(config.windowMs / 1000) || 3600,
        limits: req.widget ? this.widgetKeys.get(req.widget.keyId)?.rateLimits : null
      }),
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  /**
   * CORS handler for widgets
   */
  widgetCORS(req, res, next) {
    const origin = req.headers.origin;
    
    if (req.widget && origin && this.validateOrigin(origin, req.widget.domain)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'X-API-Key, Content-Type, Authorization, API-Version');
      res.header('Access-Control-Allow-Credentials', 'false'); // Widgets should not use credentials
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }

  /**
   * Widget analytics tracking
   */
  trackWidgetUsage(req, res, next) {
    if (req.widget) {
      // Track API usage for analytics
      const usage = {
        widgetId: req.widget.keyId,
        clientId: req.widget.clientId,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin
      };

      // In production, send to analytics service
      console.log('Widget usage:', JSON.stringify(usage, null, 2));
    }

    next();
  }

  /**
   * Error handler with widget context
   */
  errorHandler(error, req, res, next) {
    console.error('Widget API error:', error);

    const errorResponse = {
      type: 'https://api.dreamerai.io/errors/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
      instance: req.originalUrl,
      timestamp: new Date().toISOString()
    };

    if (req.widget) {
      errorResponse.widget = {
        clientId: req.widget.clientId,
        keyId: req.widget.keyId
      };
    }

    // In development, include error details
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        message: error.message,
        stack: error.stack
      };
    }

    res.status(500).json(errorResponse);
  }
}

// Create singleton instance
const apiGateway = new APIGateway();

// Register default transformers
apiGateway.createTransformer('chat', {
  request: (data, version, widget) => {
    if (version === 'v1') {
      // Transform v1 chat request format
      return {
        messages: data.messages || [],
        model: data.model || 'gpt-3.5-turbo',
        max_tokens: Math.min(data.max_tokens || 500, 1000), // Limit tokens for widgets
        temperature: Math.max(0, Math.min(data.temperature || 0.7, 1)) // Clamp temperature
      };
    }
    return data;
  },
  response: (data, version, widget) => {
    if (version === 'v1') {
      // Transform v1 chat response format
      return {
        success: true,
        message: data.message || data.choices?.[0]?.message?.content,
        usage: {
          tokens: data.tokensUsed || data.usage?.total_tokens,
          model: data.model
        },
        widget: {
          clientId: widget.clientId,
          timestamp: new Date().toISOString()
        }
      };
    }
    return data;
  }
});

apiGateway.createTransformer('showcase', {
  request: (data, version, widget) => {
    // Sanitize input for showcase demos
    return {
      text: (data.text || '').slice(0, 5000), // Limit text length
      type: data.type || 'general',
      options: {
        ...data.options,
        maxTokens: Math.min(data.options?.maxTokens || 500, 1000)
      }
    };
  },
  response: (data, version, widget) => {
    return {
      success: true,
      data: data,
      widget: {
        clientId: widget.clientId,
        attribution: 'Powered by Dreamer AI Solutions',
        timestamp: new Date().toISOString()
      }
    };
  }
});

module.exports = {
  apiGateway,
  validateWidget: apiGateway.validateWidget.bind(apiGateway),
  checkPermission: apiGateway.checkPermission.bind(apiGateway),
  versionHandler: apiGateway.versionHandler.bind(apiGateway),
  transformRequest: apiGateway.transformRequest.bind(apiGateway),
  transformResponse: apiGateway.transformResponse.bind(apiGateway),
  widgetRateLimit: apiGateway.createWidgetRateLimit(),
  widgetCORS: apiGateway.widgetCORS.bind(apiGateway),
  trackWidgetUsage: apiGateway.trackWidgetUsage.bind(apiGateway),
  errorHandler: apiGateway.errorHandler.bind(apiGateway)
};