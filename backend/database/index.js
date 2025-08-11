const crypto = require('crypto');

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/dreamer_ai',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper class for database operations
class Database {
  // User Management
  static async createUser(userData) {
    const { email, password, firstName, lastName, company, role = 'visitor' } = userData;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, company, 
        role, email_verification_token
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, created_at
    `;
    
    const values = [email, passwordHash, firstName, lastName, company, role, emailVerificationToken];
    const result = await pool.query(query, values);
    
    return {
      user: result.rows[0],
      verificationToken: emailVerificationToken
    };
  }

  static async findUserByEmail(email) {
    const query = `
      SELECT 
        id, email, password_hash, first_name, last_name, 
        role, status, email_verified, company
      FROM users 
      WHERE email = $1 AND status = 'active'
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  static async createSession(userId, ipAddress, userAgent) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '7 days')
      RETURNING id, session_token, expires_at
    `;
    
    const values = [userId, sessionToken, ipAddress, userAgent];
    const result = await pool.query(query, values);
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = $1',
      [userId]
    );
    
    return result.rows[0];
  }

  static async validateSession(sessionToken) {
    const query = `
      SELECT 
        s.id, s.user_id, s.expires_at,
        u.email, u.first_name, u.last_name, u.role, u.status
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.status = 'active'
    `;
    
    const result = await pool.query(query, [sessionToken]);
    return result.rows[0];
  }

  // Lead Management
  static async createLead(leadData) {
    const { email, firstName, lastName, company, phone, message, inquiryType, source = 'website' } = leadData;
    
    const query = `
      INSERT INTO leads (
        email, first_name, last_name, company, phone,
        message, inquiry_type, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;
    
    const values = [email, firstName, lastName, company, phone, message, inquiryType, source];
    const result = await pool.query(query, values);
    
    // Log activity
    await this.logLeadActivity(result.rows[0].id, null, 'created', `Lead created via ${  source}`);
    
    return result.rows[0];
  }

  static async logLeadActivity(leadId, userId, activityType, description) {
    const query = `
      INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
      VALUES ($1, $2, $3, $4)
    `;
    
    await pool.query(query, [leadId, userId, activityType, description]);
  }

  static async getLeads(limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT 
        l.id, l.email, l.first_name, l.last_name, l.company,
        l.status, l.source, l.score, l.created_at,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        COUNT(la.id) as activity_count
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN lead_activities la ON l.lead_id = la.lead_id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;
    
    if (filters.status) {
      query += ` AND l.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }
    
    if (filters.source) {
      query += ` AND l.source = $${paramCount}`;
      values.push(filters.source);
      paramCount++;
    }
    
    query += `
      GROUP BY l.id, u.first_name, u.last_name
      ORDER BY l.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Service Bookings
  static async createBooking(bookingData) {
    const { userId, serviceId, consultationType, scheduledAt, durationMinutes, notes } = bookingData;
    
    const query = `
      INSERT INTO service_bookings (
        user_id, service_id, consultation_type,
        scheduled_at, duration_minutes, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, scheduled_at, status
    `;
    
    const values = [userId, serviceId, consultationType, scheduledAt, durationMinutes, notes];
    const result = await pool.query(query, values);
    
    // Log audit
    await this.logAudit(userId, 'booking_created', 'booking', result.rows[0].id, null, { bookingData });
    
    return result.rows[0];
  }

  static async getAvailableSlots(serviceId, startDate, endDate) {
    const query = `
      WITH booked_slots AS (
        SELECT 
          scheduled_at,
          scheduled_at + (duration_minutes || ' minutes')::INTERVAL as end_time
        FROM service_bookings
        WHERE status IN ('pending', 'confirmed')
        AND scheduled_at >= $2
        AND scheduled_at < $3
        AND service_id = $1
      )
      SELECT 
        slot_time::TIMESTAMP as available_slot
      FROM generate_series(
        $2::TIMESTAMP,
        $3::TIMESTAMP - INTERVAL '1 hour',
        '30 minutes'::INTERVAL
      ) as slot_time
      WHERE NOT EXISTS (
        SELECT 1 
        FROM booked_slots 
        WHERE slot_time < end_time 
        AND slot_time + INTERVAL '1 hour' > scheduled_at
      )
      AND EXTRACT(DOW FROM slot_time) BETWEEN 1 AND 5
      AND EXTRACT(HOUR FROM slot_time) BETWEEN 9 AND 16
    `;
    
    const result = await pool.query(query, [serviceId, startDate, endDate]);
    return result.rows.map(row => row.available_slot);
  }

  // Chat Management
  static async saveChat(sessionId, userId, messages) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create or get conversation
      const convQuery = `
        INSERT INTO chat_conversations (user_id, session_id, title)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id) 
        DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const title = messages[0]?.content.slice(0, 100) || 'New Conversation';
      const convResult = await client.query(convQuery, [userId, sessionId, title]);
      const conversationId = convResult.rows[0].id;
      
      // Save messages
      for (const message of messages) {
        const msgQuery = `
          INSERT INTO chat_messages (
            conversation_id, role, content, tokens_used, model_used
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(msgQuery, [
          conversationId,
          message.role,
          message.content,
          message.tokens_used || 0,
          message.model_used || 'gpt-4'
        ]);
      }
      
      await client.query('COMMIT');
      return conversationId;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getChatHistory(sessionId, userId, limit = 20) {
    const query = `
      SELECT 
        m.id, m.role, m.content, m.created_at,
        c.title as conversation_title
      FROM chat_messages m
      JOIN chat_conversations c ON m.conversation_id = c.id
      WHERE (c.session_id = $1 OR (c.user_id = $2 AND $2 IS NOT NULL))
      ORDER BY m.created_at DESC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [sessionId, userId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }

  // Content Management
  static async getContentBySlug(slug) {
    const query = `
      SELECT 
        id, title, slug, page_type, content,
        meta_title, meta_description, meta_keywords,
        og_image, published_at, view_count
      FROM content_pages
      WHERE slug = $1
      AND status = 'published'
      AND published_at <= CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [slug]);
    
    if (result.rows[0]) {
      // Increment view count
      await pool.query('UPDATE content_pages SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]);
    }
    
    return result.rows[0];
  }

  static async getCaseStudies() {
    const query = `
      SELECT 
        c.id, c.title, c.slug, c.client_name, c.industry,
        c.challenge, c.solution, c.results, c.technologies,
        c.metrics, c.featured_image, c.published_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'client_name', t.client_name,
              'client_title', t.client_title,
              'content', t.content,
              'rating', t.rating
            ) 
            ORDER BY t.created_at DESC
          ) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as testimonials
      FROM case_studies c
      LEFT JOIN testimonials t ON t.case_study_id = c.id AND t.is_active = TRUE
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY c.published_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async getTestimonials(featured = false) {
    let query = `
      SELECT 
        id, client_name, client_title, client_company,
        client_image, content, rating
      FROM testimonials
      WHERE is_active = TRUE
    `;
    
    if (featured) {
      query += ' AND is_featured = TRUE';
    }
    
    query += ' ORDER BY sort_order, created_at DESC';
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Newsletter
  static async subscribeNewsletter(email, tags = []) {
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO newsletter_subscriptions (email, tags, unsubscribe_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) 
      DO UPDATE SET 
        is_active = TRUE,
        tags = newsletter_subscriptions.tags || $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, is_active
    `;
    
    const result = await pool.query(query, [email, JSON.stringify(tags), unsubscribeToken]);
    return result.rows[0];
  }

  // Analytics
  static async trackEvent(eventData) {
    const { userId, sessionId, eventType, pageUrl, properties = {}, ipAddress, userAgent } = eventData;
    
    const query = `
      INSERT INTO analytics_events (
        user_id, session_id, event_type, page_url,
        properties, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await pool.query(query, [
      userId, sessionId, eventType, pageUrl,
      JSON.stringify(properties), ipAddress, userAgent
    ]);
  }

  // Audit Logging
  static async logAudit(userId, action, entityType, entityId, oldValues, newValues) {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await pool.query(query, [
      userId, action, entityType, entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    ]);
  }

  // Utility Methods
  static async healthCheck() {
    try {
      const result = await pool.query('SELECT NOW()');
      return { status: 'healthy', timestamp: result.rows[0].now };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  static async getPool() {
    return pool;
  }
}

module.exports = Database;
module.exports.pool = pool;