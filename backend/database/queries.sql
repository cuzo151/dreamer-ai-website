-- Dreamer AI Solutions - Common Database Queries
-- These are optimized queries for common operations

-- ============================================
-- USER MANAGEMENT QUERIES
-- ============================================

-- Find user by email for authentication
PREPARE find_user_by_email AS
SELECT 
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    email_verified
FROM users 
WHERE email = $1 
AND status = 'active';

-- Update last login
PREPARE update_last_login AS
UPDATE users 
SET 
    last_login = CURRENT_TIMESTAMP,
    login_count = login_count + 1
WHERE id = $1;

-- Create new user session
PREPARE create_user_session AS
INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '7 days')
RETURNING id, session_token, expires_at;

-- Validate session token
PREPARE validate_session AS
SELECT 
    s.id,
    s.user_id,
    s.expires_at,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.status
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.session_token = $1
AND s.expires_at > CURRENT_TIMESTAMP
AND u.status = 'active';

-- ============================================
-- LEAD MANAGEMENT QUERIES
-- ============================================

-- Insert new lead from contact form
PREPARE create_lead AS
INSERT INTO leads (
    email, 
    first_name, 
    last_name, 
    company, 
    phone,
    message, 
    inquiry_type, 
    source,
    source_details
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, created_at;

-- Get leads dashboard with statistics
PREPARE get_leads_dashboard AS
WITH lead_stats AS (
    SELECT 
        status,
        COUNT(*) as count,
        AVG(score) as avg_score
    FROM leads
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY status
)
SELECT 
    l.id,
    l.email,
    l.first_name || ' ' || l.last_name as full_name,
    l.company,
    l.status,
    l.source,
    l.score,
    l.created_at,
    u.first_name || ' ' || u.last_name as assigned_to_name,
    (
        SELECT COUNT(*) 
        FROM lead_activities 
        WHERE lead_id = l.id
    ) as activity_count
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
ORDER BY l.created_at DESC
LIMIT $1 OFFSET $2;

-- Get lead conversion funnel
PREPARE get_conversion_funnel AS
SELECT 
    source,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
    COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
    COUNT(*) FILTER (WHERE status = 'negotiating') as negotiating,
    COUNT(*) FILTER (WHERE status = 'converted') as converted,
    COUNT(*) FILTER (WHERE status = 'lost') as lost,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'converted') / 
        NULLIF(COUNT(*), 0), 
        2
    ) as conversion_rate
FROM leads
WHERE created_at >= $1
GROUP BY source
ORDER BY COUNT(*) DESC;

-- ============================================
-- BOOKING MANAGEMENT QUERIES
-- ============================================

-- Get available time slots
PREPARE get_available_slots AS
WITH booked_slots AS (
    SELECT 
        scheduled_at,
        scheduled_at + (duration_minutes || ' minutes')::INTERVAL as end_time
    FROM service_bookings
    WHERE status IN ('pending', 'confirmed')
    AND scheduled_at >= $1
    AND scheduled_at < $2
    AND service_id = $3
)
SELECT 
    slot_time::TIMESTAMP as available_slot
FROM generate_series(
    $1::TIMESTAMP,
    $2::TIMESTAMP - INTERVAL '1 hour',
    '30 minutes'::INTERVAL
) as slot_time
WHERE NOT EXISTS (
    SELECT 1 
    FROM booked_slots 
    WHERE slot_time < end_time 
    AND slot_time + INTERVAL '1 hour' > scheduled_at
)
AND EXTRACT(DOW FROM slot_time) BETWEEN 1 AND 5
AND EXTRACT(HOUR FROM slot_time) BETWEEN 9 AND 16;

-- Create new booking
PREPARE create_booking AS
INSERT INTO service_bookings (
    user_id,
    service_id,
    consultation_type,
    scheduled_at,
    duration_minutes,
    notes
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, scheduled_at, status;

-- Get upcoming bookings
PREPARE get_upcoming_bookings AS
SELECT 
    b.id,
    b.scheduled_at,
    b.duration_minutes,
    b.consultation_type,
    b.status,
    b.meeting_link,
    s.name as service_name,
    u.first_name || ' ' || u.last_name as client_name,
    u.email as client_email,
    u.company as client_company
FROM service_bookings b
JOIN services s ON b.service_id = s.id
JOIN users u ON b.user_id = u.id
WHERE b.scheduled_at >= CURRENT_TIMESTAMP
AND b.status IN ('pending', 'confirmed')
ORDER BY b.scheduled_at ASC;

-- ============================================
-- CHAT CONVERSATION QUERIES
-- ============================================

-- Create or get conversation
PREPARE upsert_conversation AS
INSERT INTO chat_conversations (user_id, session_id, title)
VALUES ($1, $2, $3)
ON CONFLICT (session_id) 
DO UPDATE SET updated_at = CURRENT_TIMESTAMP
RETURNING id;

-- Save chat message
PREPARE save_chat_message AS
INSERT INTO chat_messages (
    conversation_id,
    role,
    content,
    tokens_used,
    model_used
)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, created_at;

-- Get conversation history
PREPARE get_conversation_history AS
SELECT 
    m.id,
    m.role,
    m.content,
    m.created_at,
    c.title as conversation_title
FROM chat_messages m
JOIN chat_conversations c ON m.conversation_id = c.id
WHERE c.session_id = $1
OR (c.user_id = $2 AND $2 IS NOT NULL)
ORDER BY m.created_at DESC
LIMIT $3;

-- ============================================
-- CONTENT QUERIES
-- ============================================

-- Get published content by slug
PREPARE get_content_by_slug AS
SELECT 
    id,
    title,
    slug,
    page_type,
    content,
    meta_title,
    meta_description,
    meta_keywords,
    og_image,
    published_at,
    view_count
FROM content_pages
WHERE slug = $1
AND status = 'published'
AND published_at <= CURRENT_TIMESTAMP;

-- Increment view count
PREPARE increment_view_count AS
UPDATE content_pages
SET view_count = view_count + 1
WHERE id = $1;

-- Get case studies with testimonials
PREPARE get_case_studies AS
SELECT 
    c.id,
    c.title,
    c.slug,
    c.client_name,
    c.industry,
    c.challenge,
    c.solution,
    c.results,
    c.technologies,
    c.metrics,
    c.featured_image,
    c.published_at,
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
ORDER BY c.published_at DESC;

-- ============================================
-- ANALYTICS QUERIES
-- ============================================

-- Get page view analytics
PREPARE get_page_analytics AS
SELECT 
    page_url,
    COUNT(*) as view_count,
    COUNT(DISTINCT session_id) as unique_visitors,
    COUNT(DISTINCT user_id) as registered_users,
    json_build_object(
        'desktop', COUNT(*) FILTER (WHERE properties->>'device' = 'desktop'),
        'mobile', COUNT(*) FILTER (WHERE properties->>'device' = 'mobile'),
        'tablet', COUNT(*) FILTER (WHERE properties->>'device' = 'tablet')
    ) as device_breakdown
FROM analytics_events
WHERE event_type = 'page_view'
AND created_at >= $1
AND created_at < $2
GROUP BY page_url
ORDER BY view_count DESC;

-- Get conversion metrics
PREPARE get_conversion_metrics AS
WITH funnel AS (
    SELECT 
        session_id,
        MAX(CASE WHEN event_type = 'page_view' AND page_url = '/' THEN 1 ELSE 0 END) as visited_home,
        MAX(CASE WHEN event_type = 'page_view' AND page_url LIKE '/services%' THEN 1 ELSE 0 END) as viewed_services,
        MAX(CASE WHEN event_type = 'form_start' THEN 1 ELSE 0 END) as started_form,
        MAX(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) as submitted_form
    FROM analytics_events
    WHERE created_at >= $1
    GROUP BY session_id
)
SELECT 
    COUNT(*) as total_sessions,
    SUM(visited_home) as home_visits,
    SUM(viewed_services) as service_views,
    SUM(started_form) as form_starts,
    SUM(submitted_form) as form_submits,
    ROUND(100.0 * SUM(viewed_services) / NULLIF(SUM(visited_home), 0), 2) as home_to_services_rate,
    ROUND(100.0 * SUM(started_form) / NULLIF(SUM(viewed_services), 0), 2) as services_to_form_rate,
    ROUND(100.0 * SUM(submitted_form) / NULLIF(SUM(started_form), 0), 2) as form_completion_rate
FROM funnel;

-- ============================================
-- REPORTING QUERIES
-- ============================================

-- Monthly business metrics
PREPARE get_monthly_metrics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) FILTER (WHERE entity_type = 'lead') as new_leads,
    COUNT(*) FILTER (WHERE entity_type = 'booking') as new_bookings,
    COUNT(*) FILTER (WHERE entity_type = 'user' AND action = 'signup') as new_users,
    COUNT(*) FILTER (WHERE entity_type = 'conversion') as conversions
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Service performance report
PREPARE get_service_performance AS
SELECT 
    s.name as service_name,
    COUNT(b.id) as total_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
    ROUND(
        100.0 * COUNT(b.id) FILTER (WHERE b.status = 'completed') / 
        NULLIF(COUNT(b.id), 0), 
        2
    ) as completion_rate,
    AVG(b.duration_minutes) as avg_duration
FROM services s
LEFT JOIN service_bookings b ON s.id = b.service_id
WHERE b.created_at >= $1
GROUP BY s.id, s.name
ORDER BY total_bookings DESC;