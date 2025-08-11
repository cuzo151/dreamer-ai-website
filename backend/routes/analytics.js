const express = require('express');

const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { pool } = require('../config/database');
const { authenticate: auth, authorize } = require('../middleware/auth');

// Track analytics event
router.post('/events', [
  body('eventType').notEmpty().trim(),
  body('pageUrl').optional().isURL({ require_protocol: false }),
  body('properties').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventType, pageUrl, properties } = req.body;
    const userId = req.user?.id || null;
    const sessionId = req.session?.id || req.headers['x-session-id'] || null;

    await pool.query(
      `INSERT INTO analytics_events 
       (id, event_type, user_id, session_id, page_url, properties, 
        user_agent, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        uuidv4(),
        eventType,
        userId,
        sessionId,
        pageUrl,
        JSON.stringify(properties || {}),
        req.headers['user-agent'],
        req.ip
      ]
    );

    res.json({ success: true, message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Unable to track event' });
  }
});

// Get analytics dashboard (admin only)
router.get('/dashboard', [auth, authorize('admin', 'super_admin')], async (req, res) => {
  try {
    const [
      userStats,
      eventStats,
      conversionStats,
      revenueStats
    ] = await Promise.all([
      // User statistics
      pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN id END) as new_users_today,
          COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN id END) as new_users_week,
          COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN id END) as new_users_month,
          COUNT(*) as total_users,
          COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users
        FROM users
      `),
      
      // Event statistics
      pool.query(`
        SELECT 
          event_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `),
      
      // Conversion statistics
      pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN status = 'new' THEN id END) as new_leads,
          COUNT(DISTINCT CASE WHEN status = 'contacted' THEN id END) as contacted_leads,
          COUNT(DISTINCT CASE WHEN status = 'qualified' THEN id END) as qualified_leads,
          COUNT(DISTINCT CASE WHEN status = 'converted' THEN id END) as converted_leads,
          ROUND(
            COUNT(DISTINCT CASE WHEN status = 'converted' THEN id END)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
          ) as conversion_rate
        FROM leads
        WHERE created_at > NOW() - INTERVAL '30 days'
      `),
      
      // Revenue statistics (if you have payment data)
      pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN status = 'confirmed' THEN id END) as confirmed_bookings,
          COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_bookings,
          COUNT(DISTINCT CASE WHEN status = 'cancelled' THEN id END) as cancelled_bookings
        FROM bookings
        WHERE created_at > NOW() - INTERVAL '30 days'
      `)
    ]);

    res.json({
      users: userStats.rows[0],
      events: eventStats.rows,
      conversions: conversionStats.rows[0],
      bookings: revenueStats.rows[0],
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Unable to retrieve dashboard data' });
  }
});

// Get users report
router.get('/reports/users', [auth, authorize('admin', 'super_admin')], [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN role = 'client' THEN 1 END) as client_users
      FROM users
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate, endDate]);

    const totalResult = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY role
    `, [startDate, endDate]);

    res.json({
      daily: result.rows,
      byRole: totalResult.rows,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Users report error:', error);
    res.status(500).json({ error: 'Unable to generate users report' });
  }
});

// Get conversions report
router.get('/reports/conversions', [auth, authorize('admin', 'super_admin')], [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const funnelResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::int as avg_hours_in_status
      FROM leads
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'new' THEN 1
          WHEN 'contacted' THEN 2
          WHEN 'qualified' THEN 3
          WHEN 'negotiating' THEN 4
          WHEN 'converted' THEN 5
          WHEN 'lost' THEN 6
        END
    `, [startDate, endDate]);

    const sourceResult = await pool.query(`
      SELECT 
        source,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        ROUND(
          COUNT(CASE WHEN status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 2
        ) as conversion_rate
      FROM leads
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY source
      ORDER BY total_leads DESC
    `, [startDate, endDate]);

    res.json({
      funnel: funnelResult.rows,
      bySource: sourceResult.rows,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Conversions report error:', error);
    res.status(500).json({ error: 'Unable to generate conversions report' });
  }
});

// Get revenue report
router.get('/reports/revenue', [auth, authorize('admin', 'super_admin')], [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    // Booking statistics
    const bookingResult = await pool.query(`
      SELECT 
        DATE(scheduled_at) as date,
        consultation_type,
        COUNT(*) as bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_shows
      FROM bookings
      WHERE scheduled_at BETWEEN $1 AND $2
      GROUP BY DATE(scheduled_at), consultation_type
      ORDER BY date DESC, bookings DESC
    `, [startDate, endDate]);

    // Service popularity
    const serviceResult = await pool.query(`
      SELECT 
        s.name as service_name,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings
      FROM services s
      LEFT JOIN bookings b ON s.id = b.service_id
        AND b.scheduled_at BETWEEN $1 AND $2
      GROUP BY s.id, s.name
      ORDER BY total_bookings DESC
    `, [startDate, endDate]);

    res.json({
      bookings: bookingResult.rows,
      services: serviceResult.rows,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ error: 'Unable to generate revenue report' });
  }
});

module.exports = router;