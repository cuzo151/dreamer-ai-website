const expressWinston = require('express-winston');
const winston = require('winston');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dreamer-ai-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

// Express request logger middleware
const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp()
  ),
  meta: true,
  msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  expressFormat: false,
  colorize: true,
  ignoreRoute (req, res) { 
    // Don't log health checks
    return req.path === '/health'; 
  }
});

// Express error logger middleware
const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp()
  )
});

module.exports = {
  logger,
  requestLogger,
  errorLogger
};