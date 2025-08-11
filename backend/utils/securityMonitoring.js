const crypto = require('crypto');
const EventEmitter = require('events');

const redis = require('ioredis');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Initialize Redis client
const redisClient = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

/**
 * Security Event Types
 */
const SecurityEventTypes = {
  // Authentication Events
  AUTH_SUCCESS: 'auth.success',
  AUTH_FAILURE: 'auth.failure',
  AUTH_LOCKOUT: 'auth.lockout',
  PASSWORD_RESET: 'auth.password_reset',
  MFA_ENABLED: 'auth.mfa_enabled',
  MFA_DISABLED: 'auth.mfa_disabled',
  
  // Access Control Events
  ACCESS_GRANTED: 'access.granted',
  ACCESS_DENIED: 'access.denied',
  PRIVILEGE_ESCALATION: 'access.privilege_escalation',
  UNAUTHORIZED_ACCESS: 'access.unauthorized',
  
  // Data Events
  DATA_ACCESS: 'data.access',
  DATA_MODIFICATION: 'data.modification',
  DATA_DELETION: 'data.deletion',
  DATA_EXPORT: 'data.export',
  DATA_BREACH_ATTEMPT: 'data.breach_attempt',
  
  // System Events
  SYSTEM_START: 'system.start',
  SYSTEM_STOP: 'system.stop',
  CONFIG_CHANGE: 'system.config_change',
  SECURITY_UPDATE: 'system.security_update',
  
  // Threat Events
  INJECTION_ATTEMPT: 'threat.injection',
  XSS_ATTEMPT: 'threat.xss',
  CSRF_ATTEMPT: 'threat.csrf',
  BRUTE_FORCE: 'threat.brute_force',
  RATE_LIMIT_EXCEEDED: 'threat.rate_limit',
  SUSPICIOUS_ACTIVITY: 'threat.suspicious',
  MALWARE_DETECTED: 'threat.malware',
  
  // Compliance Events
  GDPR_REQUEST: 'compliance.gdpr_request',
  DATA_RETENTION: 'compliance.data_retention',
  AUDIT_ACCESS: 'compliance.audit_access'
};

/**
 * Security Logger Configuration
 */
class SecurityLogger {
  constructor() {
    // Configure Winston logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'dreamer-ai-security',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // File transport for security events
        new winston.transports.File({
          filename: 'logs/security-error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        
        new winston.transports.File({
          filename: 'logs/security-combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10
        })
      ]
    });
    
    // Add Elasticsearch transport in production
    if (process.env.ELASTICSEARCH_URL) {
      this.logger.add(new ElasticsearchTransport({
        level: 'info',
        clientOpts: { node: process.env.ELASTICSEARCH_URL },
        index: 'security-logs'
      }));
    }
  }
  
  /**
   * Log security event
   */
  logEvent(eventType, details, severity = 'info') {
    const event = {
      id: crypto.randomBytes(16).toString('hex'),
      type: eventType,
      timestamp: new Date().toISOString(),
      severity,
      details,
      correlationId: details.correlationId || crypto.randomBytes(8).toString('hex')
    };
    
    // Log to Winston
    this.logger.log(severity, eventType, event);
    
    // Store in Redis for real-time monitoring
    this.storeEvent(event);
    
    // Trigger alerts for critical events
    if (severity === 'critical' || severity === 'error') {
      this.triggerAlert(event);
    }
    
    return event;
  }
  
  /**
   * Store event in Redis
   */
  async storeEvent(event) {
    const key = `security:events:${event.type}:${event.timestamp}`;
    await redisClient.setex(key, 86400 * 30, JSON.stringify(event)); // Keep for 30 days
    
    // Add to time series for monitoring
    await redisClient.zadd(
      `security:timeline:${event.type}`,
      Date.now(),
      event.id
    );
    
    // Update counters
    await redisClient.hincrby('security:counters', event.type, 1);
    await redisClient.hincrby('security:counters:daily', `${event.type}:${new Date().toISOString().split('T')[0]}`, 1);
  }
  
  /**
   * Trigger security alert
   */
  async triggerAlert(event) {
    // Implement alert mechanisms
    console.error('[SECURITY ALERT]', event);
    
    // Add to alert queue
    await redisClient.lpush('security:alerts', JSON.stringify(event));
    
    // Send notifications (implement based on your notification service)
    // await sendEmail(event);
    // await sendSlack(event);
    // await sendPagerDuty(event);
  }
  
  /**
   * Query security events
   */
  async queryEvents(filters = {}) {
    const { type, severity, startDate, endDate, limit = 100 } = filters;
    
    // Build query based on filters
    // This is a simplified implementation - use Elasticsearch for complex queries
    const events = [];
    
    if (type) {
      const keys = await redisClient.keys(`security:events:${type}:*`);
      for (const key of keys.slice(0, limit)) {
        const event = await redisClient.get(key);
        if (event) events.push(JSON.parse(event));
      }
    }
    
    return events;
  }
  
  /**
   * Get security metrics
   */
  async getMetrics() {
    const counters = await redisClient.hgetall('security:counters');
    const dailyCounters = await redisClient.hgetall('security:counters:daily');
    
    return {
      total: counters,
      daily: dailyCounters,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Threat Detection System
 */
class ThreatDetector extends EventEmitter {
  constructor(securityLogger) {
    super();
    this.logger = securityLogger;
    this.patterns = new Map();
    this.thresholds = new Map();
    
    this.initializePatterns();
    this.initializeThresholds();
  }
  
  /**
   * Initialize threat patterns
   */
  initializePatterns() {
    // SQL Injection patterns
    this.patterns.set('sql_injection', [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(-{2}|\/\*|\*\/)/g,
      /(';|";|`|]|\\)/g
    ]);
    
    // XSS patterns
    this.patterns.set('xss', [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi
    ]);
    
    // Path traversal patterns
    this.patterns.set('path_traversal', [
      /\.\.\//g,
      /\.\.\\+/g,
      /%2e%2e/gi,
      /%252e%252e/gi
    ]);
    
    // Command injection patterns
    this.patterns.set('command_injection', [
      /[$&();`|]/g,
      /\${.*}/g,
      /\$\(.*\)/g
    ]);
  }
  
  /**
   * Initialize threat thresholds
   */
  initializeThresholds() {
    this.thresholds.set('failed_login', { count: 5, window: 300 }); // 5 attempts in 5 minutes
    this.thresholds.set('rate_limit', { count: 100, window: 60 }); // 100 requests per minute
    this.thresholds.set('suspicious_activity', { count: 10, window: 600 }); // 10 events in 10 minutes
  }
  
  /**
   * Detect threats in request
   */
  async detectThreats(req) {
    const threats = [];
    
    // Check for injection attacks
    const input = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    for (const [threatType, patterns] of this.patterns) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          threats.push({
            type: threatType,
            pattern: pattern.toString(),
            severity: 'high'
          });
        }
      }
    }
    
    // Check for anomalous behavior
    const anomalies = await this.detectAnomalies(req);
    threats.push(...anomalies);
    
    // Log detected threats
    if (threats.length > 0) {
      this.logger.logEvent(SecurityEventTypes.SUSPICIOUS_ACTIVITY, {
        ip: req.ip,
        url: req.originalUrl,
        threats,
        headers: req.headers
      }, 'warning');
      
      this.emit('threat-detected', { req, threats });
    }
    
    return threats;
  }
  
  /**
   * Detect anomalous behavior
   */
  async detectAnomalies(req) {
    const anomalies = [];
    const userKey = req.user ? req.user.id : req.ip;
    
    // Check request rate
    const requestCount = await this.getRequestCount(userKey);
    if (requestCount > this.thresholds.get('rate_limit').count) {
      anomalies.push({
        type: 'rate_anomaly',
        severity: 'medium',
        count: requestCount
      });
    }
    
    // Check geographic anomaly (if IP geolocation is available)
    const geoAnomaly = await this.checkGeographicAnomaly(req);
    if (geoAnomaly) {
      anomalies.push(geoAnomaly);
    }
    
    // Check time-based anomaly
    const timeAnomaly = this.checkTimeAnomaly(req);
    if (timeAnomaly) {
      anomalies.push(timeAnomaly);
    }
    
    return anomalies;
  }
  
  /**
   * Get request count for rate limiting
   */
  async getRequestCount(key) {
    const window = 60; // 1 minute window
    const now = Date.now();
    const windowStart = now - (window * 1000);
    
    // Remove old entries
    await redisClient.zremrangebyscore(`requests:${key}`, '-inf', windowStart);
    
    // Add current request
    await redisClient.zadd(`requests:${key}`, now, now);
    
    // Count requests in window
    return await redisClient.zcount(`requests:${key}`, windowStart, now);
  }
  
  /**
   * Check for geographic anomalies
   */
  async checkGeographicAnomaly(req) {
    // Implement IP geolocation check
    // This is a placeholder - integrate with IP geolocation service
    return null;
  }
  
  /**
   * Check for time-based anomalies
   */
  checkTimeAnomaly(req) {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Check for unusual access times
    if (hour >= 2 && hour <= 5) {
      return {
        type: 'time_anomaly',
        severity: 'low',
        description: 'Access during unusual hours'
      };
    }
    
    return null;
  }
}

/**
 * Security Monitoring Dashboard
 */
class SecurityMonitor {
  constructor(securityLogger, threatDetector) {
    this.logger = securityLogger;
    this.detector = threatDetector;
    this.metrics = new Map();
  }
  
  /**
   * Start monitoring
   */
  start() {
    // Update metrics every minute
    setInterval(() => this.updateMetrics(), 60000);
    
    // Check for security alerts every 5 minutes
    setInterval(() => this.checkAlerts(), 300000);
    
    console.log('Security monitoring started');
  }
  
  /**
   * Update security metrics
   */
  async updateMetrics() {
    const metrics = await this.logger.getMetrics();
    
    // Calculate rates
    const authFailureRate = metrics.total[SecurityEventTypes.AUTH_FAILURE] || 0;
    const authSuccessRate = metrics.total[SecurityEventTypes.AUTH_SUCCESS] || 0;
    
    this.metrics.set('auth_failure_rate', authFailureRate / (authFailureRate + authSuccessRate));
    this.metrics.set('total_threats', Object.values(metrics.total).reduce((a, b) => a + b, 0));
    
    // Store metrics
    await redisClient.hset('security:metrics', Object.fromEntries(this.metrics));
  }
  
  /**
   * Check for security alerts
   */
  async checkAlerts() {
    const alerts = [];
    
    // Check authentication failure rate
    const authFailureRate = this.metrics.get('auth_failure_rate') || 0;
    if (authFailureRate > 0.3) {
      alerts.push({
        type: 'high_auth_failure_rate',
        severity: 'high',
        value: authFailureRate
      });
    }
    
    // Check for threat spikes
    const recentThreats = await this.getRecentThreatCount();
    if (recentThreats > 50) {
      alerts.push({
        type: 'threat_spike',
        severity: 'critical',
        value: recentThreats
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      this.logger.logEvent(SecurityEventTypes.SUSPICIOUS_ACTIVITY, alert, alert.severity);
    }
  }
  
  /**
   * Get recent threat count
   */
  async getRecentThreatCount() {
    const window = 3600000; // 1 hour
    const now = Date.now();
    let count = 0;
    
    for (const eventType of Object.values(SecurityEventTypes)) {
      if (eventType.startsWith('threat.')) {
        count += await redisClient.zcount(
          `security:timeline:${eventType}`,
          now - window,
          now
        );
      }
    }
    
    return count;
  }
  
  /**
   * Get security dashboard data
   */
  async getDashboardData() {
    const metrics = await this.logger.getMetrics();
    const recentEvents = await this.logger.queryEvents({ limit: 50 });
    const alerts = await redisClient.lrange('security:alerts', 0, 10);
    
    return {
      metrics: Object.fromEntries(this.metrics),
      counters: metrics,
      recentEvents,
      alerts: alerts.map(a => JSON.parse(a)),
      status: this.getSecurityStatus()
    };
  }
  
  /**
   * Get overall security status
   */
  getSecurityStatus() {
    const authFailureRate = this.metrics.get('auth_failure_rate') || 0;
    const totalThreats = this.metrics.get('total_threats') || 0;
    
    if (authFailureRate > 0.5 || totalThreats > 1000) {
      return 'critical';
    } else if (authFailureRate > 0.3 || totalThreats > 500) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
}

/**
 * Audit Trail System
 */
class AuditTrail {
  constructor(securityLogger) {
    this.logger = securityLogger;
  }
  
  /**
   * Log audit event
   */
  async log(action, details) {
    const auditEvent = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      action,
      userId: details.userId,
      targetId: details.targetId,
      targetType: details.targetType,
      changes: details.changes,
      metadata: details.metadata,
      ip: details.ip,
      userAgent: details.userAgent
    };
    
    // Store in audit log
    const key = `audit:${action}:${auditEvent.timestamp}`;
    await redisClient.setex(key, 86400 * 365, JSON.stringify(auditEvent)); // Keep for 1 year
    
    // Index by user
    await redisClient.zadd(
      `audit:user:${details.userId}`,
      Date.now(),
      auditEvent.id
    );
    
    // Index by target
    if (details.targetId) {
      await redisClient.zadd(
        `audit:target:${details.targetType}:${details.targetId}`,
        Date.now(),
        auditEvent.id
      );
    }
    
    return auditEvent;
  }
  
  /**
   * Query audit trail
   */
  async query(filters = {}) {
    const { userId, targetId, targetType, action, startDate, endDate } = filters;
    const events = [];
    
    // Query by user
    if (userId) {
      const eventIds = await redisClient.zrange(`audit:user:${userId}`, 0, -1);
      for (const id of eventIds) {
        const event = await this.getEventById(id);
        if (event) events.push(event);
      }
    }
    
    // Filter by criteria
    return events.filter(event => {
      if (action && event.action !== action) return false;
      if (targetType && event.targetType !== targetType) return false;
      if (startDate && new Date(event.timestamp) < new Date(startDate)) return false;
      if (endDate && new Date(event.timestamp) > new Date(endDate)) return false;
      return true;
    });
  }
  
  /**
   * Get audit event by ID
   */
  async getEventById(id) {
    const keys = await redisClient.keys(`audit:*:*`);
    for (const key of keys) {
      const event = await redisClient.get(key);
      if (event) {
        const parsed = JSON.parse(event);
        if (parsed.id === id) return parsed;
      }
    }
    return null;
  }
}

// Create instances
const securityLogger = new SecurityLogger();
const threatDetector = new ThreatDetector(securityLogger);
const securityMonitor = new SecurityMonitor(securityLogger, threatDetector);
const auditTrail = new AuditTrail(securityLogger);

// Start monitoring
securityMonitor.start();

module.exports = {
  SecurityEventTypes,
  securityLogger,
  threatDetector,
  securityMonitor,
  auditTrail,
  SecurityLogger,
  ThreatDetector,
  SecurityMonitor,
  AuditTrail
};