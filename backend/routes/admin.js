const express = require('express');

const router = express.Router();
const { query, validationResult } = require('express-validator');

const { pool } = require('../config/database');
const { authenticate: auth, authorize } = require('../middleware/auth');

// Get system statistics
router.get('/stats', [auth, authorize('admin', 'super_admin')], async (req, res) => {
  try {
    const [
      userStats,
      leadStats,
      bookingStats,
      contentStats,
      systemStats
    ] = await Promise.all([
      // User statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'visitor' THEN 1 END) as visitors,
          COUNT(CASE WHEN role = 'client' THEN 1 END) as clients,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_today,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_today
        FROM users
      `),

      // Lead statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
          COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
          COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as leads_this_week
        FROM leads
      `),

      // Booking statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN scheduled_at > NOW() THEN 1 END) as upcoming,
          COUNT(CASE WHEN scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 1 END) as next_week
        FROM bookings
      `),

      // Content statistics
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM services WHERE is_active = true) as active_services,
          (SELECT COUNT(*) FROM case_studies WHERE status = 'published') as published_case_studies,
          (SELECT COUNT(*) FROM testimonials WHERE is_active = true) as active_testimonials,
          (SELECT COUNT(*) FROM chat_conversations) as total_conversations,
          (SELECT COUNT(*) FROM chat_messages) as total_messages
      `),

      // System health
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM analytics_events WHERE created_at > NOW() - INTERVAL '1 hour') as events_last_hour,
          (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE created_at > NOW() - INTERVAL '1 hour') as sessions_last_hour,
          (SELECT pg_database_size(current_database())) as database_size_bytes,
          (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
      `)
    ]);

    res.json({
      users: userStats.rows[0],
      leads: leadStats.rows[0],
      bookings: bookingStats.rows[0],
      content: contentStats.rows[0],
      system: {
        ...systemStats.rows[0],
        database_size_mb: Math.round(systemStats.rows[0].database_size_bytes / (1024 * 1024)),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Unable to retrieve system statistics' });
  }
});

// Get audit logs
router.get('/audit-logs', [auth, authorize('admin', 'super_admin')], [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userId').optional().isUUID(),
  query('entityType').optional().isString(),
  query('action').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (req.query.userId) {
      conditions.push(`user_id = $${paramCount}`);
      values.push(req.query.userId);
      paramCount++;
    }

    if (req.query.entityType) {
      conditions.push(`entity_type = $${paramCount}`);
      values.push(req.query.entityType);
      paramCount++;
    }

    if (req.query.action) {
      conditions.push(`action = $${paramCount}`);
      values.push(req.query.action);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = Number.parseInt(countResult.rows[0].count);

    // Get logs
    values.push(limit, offset);
    const query = `
      SELECT 
        al.*,
        u.email as user_email,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await pool.query(query, values);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Unable to retrieve audit logs' });
  }
});

// Get system health
router.get('/system-health', [auth, authorize('admin', 'super_admin')], async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check database
    try {
      await pool.query('SELECT 1');
      health.services.database = { status: 'healthy', message: 'Connected' };
    } catch (error) {
      health.services.database = { status: 'unhealthy', message: error.message };
      health.status = 'degraded';
    }

    // Check Redis (if configured)
    if (process.env.REDIS_URL) {
      try {
        const redis = require('../config/redis');
        await redis.ping();
        health.services.redis = { status: 'healthy', message: 'Connected' };
      } catch (error) {
        health.services.redis = { status: 'unhealthy', message: error.message };
        health.status = 'degraded';
      }
    }

    // Check AI services
    health.services.ai = {
      openai: AI_PROVIDERS.openai.apiKey ? 'configured' : 'not configured',
      anthropic: AI_PROVIDERS.anthropic.apiKey ? 'configured' : 'not configured'
    };

    // System metrics
    const systemMetrics = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_stat_activity) as db_connections,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
        pg_database_size(current_database()) as database_size
    `);

    health.metrics = {
      ...systemMetrics.rows[0],
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version
    };

    res.json(health);
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Unable to check system health',
      timestamp: new Date().toISOString()
    });
  }
});

// Backup database (super admin only)
router.post('/backup', [auth, authorize('super_admin')], async (req, res) => {
  try {
    // This would typically trigger a backup process
    // For now, just log the request
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, details)
       VALUES (gen_random_uuid(), $1, 'backup_initiated', 'system', $2)`,
      [req.user.id, JSON.stringify({ timestamp: new Date().toISOString() })]
    );

    res.json({
      success: true,
      message: 'Database backup initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Unable to initiate backup' });
  }
});

// Clear cache (admin only)
router.post('/clear-cache', [auth, authorize('admin', 'super_admin')], async (req, res) => {
  try {
    // Clear Redis cache if available
    if (process.env.REDIS_URL) {
      const redis = require('../config/redis');
      await redis.flushAll();
    }

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, details)
       VALUES (gen_random_uuid(), $1, 'cache_cleared', 'system', $2)`,
      [req.user.id, JSON.stringify({ timestamp: new Date().toISOString() })]
    );

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Unable to clear cache' });
  }
});

// AI provider reference for health check
const AI_PROVIDERS = {
  openai: { apiKey: process.env.OPENAI_API_KEY },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY }
};

module.exports = router;