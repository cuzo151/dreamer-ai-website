module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: 'development'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'dreamer',
    password: process.env.DB_PASS || 'dreamerpass',
    database: process.env.DB_NAME || 'dreamerai_dev',
    ssl: false,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'redispass',
    db: 0,
    keyPrefix: 'dreamer:dev:'
  },

  // Security Configuration
  security: {
    bcryptRounds: 10,
    jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret',
    jwtExpiresIn: '7d',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    refreshTokenExpiresIn: '30d',
    sessionSecret: process.env.SESSION_SECRET || 'development-session-secret',
    cookieSecret: process.env.COOKIE_SECRET || 'development-cookie-secret'
  },

  // CORS Configuration
  cors: {
    origin: [
      'https://dreamer.local',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Logging Configuration
  logging: {
    level: 'debug',
    format: 'dev',
    logToFile: true,
    logDir: './logs',
    maxFiles: 5,
    maxSize: '10m'
  },

  // Email Configuration (Mailhog)
  email: {
    host: 'mailhog',
    port: 1025,
    secure: false,
    auth: null,
    from: 'noreply@dreamer-ai.com',
    fromName: 'Dreamer AI Solutions'
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadDir: './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },

  // API Configuration
  api: {
    version: 'v1',
    prefix: '/api',
    pagination: {
      defaultLimit: 20,
      maxLimit: 100
    }
  },

  // External Services
  services: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-opus-20240229',
      maxTokens: 2000
    }
  },

  // Monitoring
  monitoring: {
    prometheus: {
      enabled: true,
      port: 9091,
      path: '/metrics'
    },
    jaeger: {
      enabled: true,
      serviceName: 'dreamer-backend-dev',
      endpoint: 'http://jaeger:14268/api/traces',
      sampleRate: 1.0
    }
  },

  // Feature Flags
  features: {
    aiChat: true,
    videoShowcase: true,
    advancedAuth: true,
    twoFactorAuth: true,
    socialAuth: false,
    webhooks: true,
    apiRateLimiting: true,
    caching: true
  },

  // Development Specific
  development: {
    seedDatabase: true,
    mockExternalServices: false,
    verboseErrors: true,
    stackTraces: true,
    hotReload: true,
    debugMode: true
  }
};