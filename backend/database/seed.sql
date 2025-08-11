-- Dreamer AI Solutions Database Seed Data
-- This file contains initial data for development and testing

-- Insert admin user (password: Admin123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified)
VALUES (
    'admin@dreamerai.io',
    crypt('Admin123!', gen_salt('bf')),
    'Admin',
    'User',
    'super_admin',
    'active',
    TRUE
);

-- Insert test client user (password: Client123!)
INSERT INTO users (email, password_hash, first_name, last_name, company, role, status, email_verified)
VALUES (
    'john.doe@techcorp.com',
    crypt('Client123!', gen_salt('bf')),
    'John',
    'Doe',
    'TechCorp Industries',
    'client',
    'active',
    TRUE
);

-- Insert AI services
INSERT INTO services (name, slug, description, features, pricing, duration_minutes, is_active, sort_order)
VALUES 
(
    'AI Strategy Consultation',
    'ai-strategy-consultation',
    'Comprehensive AI strategy development for your business transformation',
    '["Custom AI roadmap", "Technology assessment", "ROI analysis", "Implementation timeline", "Risk mitigation plan"]'::jsonb,
    '{"type": "fixed", "amount": 2500, "currency": "USD", "billing": "per_session"}'::jsonb,
    120,
    TRUE,
    1
),
(
    'Custom AI Development',
    'custom-ai-development',
    'Bespoke AI solutions tailored to your specific business needs',
    '["Requirements analysis", "Prototype development", "Model training", "Integration support", "Performance optimization"]'::jsonb,
    '{"type": "custom", "starting_at": 15000, "currency": "USD", "billing": "project"}'::jsonb,
    NULL,
    TRUE,
    2
),
(
    'AI Integration Services',
    'ai-integration-services',
    'Seamlessly integrate AI capabilities into your existing systems',
    '["API development", "System integration", "Data pipeline setup", "Testing & QA", "Documentation"]'::jsonb,
    '{"type": "hourly", "rate": 250, "currency": "USD", "minimum_hours": 20}'::jsonb,
    60,
    TRUE,
    3
),
(
    'AI Training Workshop',
    'ai-training-workshop',
    'Empower your team with hands-on AI knowledge and skills',
    '["Fundamentals of AI/ML", "Practical exercises", "Use case development", "Best practices", "Q&A sessions"]'::jsonb,
    '{"type": "fixed", "amount": 5000, "currency": "USD", "billing": "per_workshop", "max_attendees": 20}'::jsonb,
    480,
    TRUE,
    4
);

-- Insert sample case studies
INSERT INTO case_studies (
    title, 
    slug, 
    client_name, 
    industry, 
    challenge, 
    solution, 
    results, 
    technologies, 
    metrics,
    status,
    published_at,
    author_id
)
VALUES 
(
    'Revolutionizing Customer Service with AI Chatbots',
    'techcorp-ai-chatbot-transformation',
    'TechCorp Industries',
    'Technology',
    'TechCorp was struggling with high customer service costs and long response times, leading to decreased customer satisfaction.',
    'We implemented a custom AI chatbot solution powered by advanced NLP models, integrated with their existing CRM system.',
    'The AI chatbot now handles 80% of customer inquiries automatically, reducing response time from hours to seconds.',
    '["GPT-4", "LangChain", "PostgreSQL", "Redis", "Docker", "Kubernetes"]'::jsonb,
    '{"response_time_reduction": "95%", "cost_savings": "$2.5M annually", "customer_satisfaction_increase": "40%", "tickets_automated": "80%"}'::jsonb,
    'published',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    (SELECT id FROM users WHERE email = 'admin@dreamerai.io')
),
(
    'AI-Powered Supply Chain Optimization',
    'logistics-ai-supply-chain',
    'Global Logistics Corp',
    'Logistics',
    'Complex supply chain with multiple vendors and unpredictable demand patterns causing inventory issues.',
    'Developed a predictive AI model for demand forecasting and route optimization using machine learning.',
    'Achieved significant reduction in inventory costs and improved delivery times across the network.',
    '["TensorFlow", "Python", "Apache Kafka", "Elasticsearch", "AWS SageMaker"]'::jsonb,
    '{"inventory_cost_reduction": "35%", "delivery_time_improvement": "25%", "forecast_accuracy": "92%"}'::jsonb,
    'published',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    (SELECT id FROM users WHERE email = 'admin@dreamerai.io')
);

-- Insert testimonials
INSERT INTO testimonials (
    client_name,
    client_title,
    client_company,
    content,
    rating,
    case_study_id,
    is_featured,
    is_active
)
VALUES 
(
    'Sarah Johnson',
    'CTO',
    'TechCorp Industries',
    'Dreamer AI Solutions transformed our customer service operations. Their AI chatbot solution not only reduced our costs dramatically but also improved our customer satisfaction scores beyond our expectations.',
    5,
    (SELECT id FROM case_studies WHERE slug = 'techcorp-ai-chatbot-transformation'),
    TRUE,
    TRUE
),
(
    'Michael Chen',
    'VP of Operations',
    'Global Logistics Corp',
    'The AI-powered supply chain optimization system has been a game-changer for us. We''ve seen remarkable improvements in efficiency and cost savings. The team at Dreamer AI truly understands business needs.',
    5,
    (SELECT id FROM case_studies WHERE slug = 'logistics-ai-supply-chain'),
    TRUE,
    TRUE
),
(
    'Jennifer Martinez',
    'CEO',
    'Innovation Labs',
    'Working with Dreamer AI Solutions was an exceptional experience. Their expertise in AI strategy helped us identify opportunities we hadn''t even considered. Highly recommended!',
    5,
    NULL,
    FALSE,
    TRUE
);

-- Insert sample leads
INSERT INTO leads (
    email,
    first_name,
    last_name,
    company,
    message,
    inquiry_type,
    status,
    source,
    source_details,
    score
)
VALUES 
(
    'prospect1@company.com',
    'David',
    'Wilson',
    'Retail Giant Inc',
    'We are interested in implementing AI for inventory management and customer personalization.',
    'Custom Development',
    'qualified',
    'website',
    'Contact form submission',
    75
),
(
    'prospect2@startup.com',
    'Emily',
    'Brown',
    'FinTech Startup',
    'Looking for AI consultation to improve our fraud detection capabilities.',
    'Consultation',
    'new',
    'referral',
    'Referred by TechCorp Industries',
    85
);

-- Insert sample newsletter subscriptions
INSERT INTO newsletter_subscriptions (email, is_active, tags)
VALUES 
    ('subscriber1@email.com', TRUE, '["ai-trends", "case-studies"]'::jsonb),
    ('subscriber2@email.com', TRUE, '["workshops", "product-updates"]'::jsonb),
    ('john.doe@techcorp.com', TRUE, '["all"]'::jsonb);

-- Insert sample content pages
INSERT INTO content_pages (
    title,
    slug,
    page_type,
    content,
    meta_title,
    meta_description,
    status,
    published_at,
    author_id
)
VALUES 
(
    'About Dreamer AI Solutions',
    'about',
    'landing',
    '{
        "hero": {
            "title": "Transforming Business with AI",
            "subtitle": "Your trusted partner in AI innovation"
        },
        "sections": [
            {
                "type": "text",
                "content": "Dreamer AI Solutions is at the forefront of artificial intelligence implementation..."
            },
            {
                "type": "team",
                "members": [
                    {
                        "name": "James Lasalle",
                        "role": "CEO & Founder",
                        "bio": "Visionary leader with 20+ years in AI and technology"
                    }
                ]
            }
        ]
    }'::jsonb,
    'About Us - Dreamer AI Solutions',
    'Learn about Dreamer AI Solutions, your trusted partner in AI transformation and innovation.',
    'published',
    CURRENT_TIMESTAMP - INTERVAL '90 days',
    (SELECT id FROM users WHERE email = 'admin@dreamerai.io')
),
(
    'AI Implementation Best Practices',
    'ai-implementation-best-practices',
    'blog',
    '{
        "title": "AI Implementation Best Practices",
        "author": "Dreamer AI Team",
        "content": [
            {
                "type": "paragraph",
                "text": "Implementing AI successfully requires careful planning and execution..."
            },
            {
                "type": "list",
                "items": [
                    "Start with clear business objectives",
                    "Ensure data quality and availability",
                    "Build a skilled team",
                    "Plan for scalability"
                ]
            }
        ]
    }'::jsonb,
    'AI Implementation Best Practices - Dreamer AI Solutions',
    'Discover the key best practices for successful AI implementation in your organization.',
    'published',
    CURRENT_TIMESTAMP - INTERVAL '15 days',
    (SELECT id FROM users WHERE email = 'admin@dreamerai.io')
);

-- Insert sample chat conversation for anonymous user
INSERT INTO chat_conversations (user_id, session_id, title)
VALUES 
    (NULL, 'anonymous-session-123', 'AI Strategy Questions'),
    ((SELECT id FROM users WHERE email = 'john.doe@techcorp.com'), 'user-session-456', 'Integration Support');

-- Insert sample chat messages
INSERT INTO chat_messages (conversation_id, role, content, tokens_used, model_used)
VALUES 
    (
        (SELECT id FROM chat_conversations WHERE session_id = 'anonymous-session-123'),
        'user',
        'What are the key considerations for implementing AI in a retail business?',
        15,
        'gpt-4'
    ),
    (
        (SELECT id FROM chat_conversations WHERE session_id = 'anonymous-session-123'),
        'assistant',
        'Great question! Here are the key considerations for implementing AI in retail:\n\n1. **Customer Experience Enhancement**\n   - Personalized recommendations\n   - Chatbots for customer service\n   - Virtual try-on solutions\n\n2. **Inventory Management**\n   - Demand forecasting\n   - Stock optimization\n   - Supply chain automation\n\n3. **Data Requirements**\n   - Customer purchase history\n   - Product catalog data\n   - Real-time inventory levels\n\n4. **Technology Infrastructure**\n   - Cloud computing capabilities\n   - API integrations\n   - Security measures\n\n5. **ROI Considerations**\n   - Initial investment costs\n   - Expected efficiency gains\n   - Customer retention improvements\n\nWould you like me to elaborate on any of these areas?',
        250,
        'gpt-4'
    );

-- Insert sample analytics events
INSERT INTO analytics_events (user_id, session_id, event_type, page_url, properties)
VALUES 
    (NULL, 'anonymous-session-123', 'page_view', '/services', '{"referrer": "google.com", "device": "desktop"}'::jsonb),
    (NULL, 'anonymous-session-123', 'form_start', '/contact', '{"form_type": "contact"}'::jsonb),
    ((SELECT id FROM users WHERE email = 'john.doe@techcorp.com'), 'user-session-456', 'download', '/case-studies/techcorp-ai-chatbot-transformation', '{"file_type": "pdf"}'::jsonb);

-- Create initial audit log entry
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
VALUES 
    (
        (SELECT id FROM users WHERE email = 'admin@dreamerai.io'),
        'database_seeded',
        'system',
        NULL,
        jsonb_build_object('message', 'Initial database seed completed', 'timestamp', CURRENT_TIMESTAMP)
    );