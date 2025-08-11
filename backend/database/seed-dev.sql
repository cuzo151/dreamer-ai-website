-- Development seed data for Dreamer AI Solutions
-- This file contains test data for development environment

-- Clear existing data (be careful in production!)
TRUNCATE TABLE bookings, leads, users, services RESTART IDENTITY CASCADE;

-- Insert test users
INSERT INTO users (email, password_hash, full_name, role, email_verified, created_at) VALUES
('admin@dreamer-ai.com', '$2b$10$K3XmGeLqCDem0z8m7QfJxOa3Kb1NB5fhRz0pK9T4bAx6YzNfLPMGy', 'Admin User', 'admin', true, NOW()),
('john.doe@example.com', '$2b$10$K3XmGeLqCDem0z8m7QfJxOa3Kb1NB5fhRz0pK9T4bAx6YzNfLPMGy', 'John Doe', 'customer', true, NOW()),
('jane.smith@example.com', '$2b$10$K3XmGeLqCDem0z8m7QfJxOa3Kb1NB5fhRz0pK9T4bAx6YzNfLPMGy', 'Jane Smith', 'customer', true, NOW()),
('bob.wilson@example.com', '$2b$10$K3XmGeLqCDem0z8m7QfJxOa3Kb1NB5fhRz0pK9T4bAx6YzNfLPMGy', 'Bob Wilson', 'customer', false, NOW()),
('alice.johnson@example.com', '$2b$10$K3XmGeLqCDem0z8m7QfJxOa3Kb1NB5fhRz0pK9T4bAx6YzNfLPMGy', 'Alice Johnson', 'customer', true, NOW());
-- Password for all test users is: TestPassword123!

-- Insert services
INSERT INTO services (name, description, category, price, duration_minutes, active, features, created_at) VALUES
('AI Chatbot Development', 'Custom AI chatbot development with natural language processing', 'ai_solutions', 5000.00, 60, true, 
 '["Natural Language Processing", "Multi-language Support", "Integration with existing systems", "Analytics Dashboard", "24/7 Support"]', NOW()),

('Machine Learning Model Training', 'Custom ML model development and training for your specific use case', 'ai_solutions', 8000.00, 90, true, 
 '["Custom Model Architecture", "Data Preprocessing", "Model Optimization", "Performance Monitoring", "API Integration"]', NOW()),

('AI Strategy Consultation', 'Strategic consultation for AI implementation in your business', 'consultation', 1500.00, 120, true, 
 '["Business Analysis", "AI Roadmap Development", "ROI Estimation", "Technology Stack Recommendation", "Implementation Plan"]', NOW()),

('Computer Vision Solutions', 'Image and video analysis using advanced computer vision', 'ai_solutions', 10000.00, 60, true, 
 '["Object Detection", "Face Recognition", "Video Analytics", "Real-time Processing", "Custom Training"]', NOW()),

('Natural Language Processing', 'Advanced NLP solutions for text analysis and generation', 'ai_solutions', 7500.00, 60, true, 
 '["Sentiment Analysis", "Text Classification", "Entity Recognition", "Language Translation", "Content Generation"]', NOW()),

('AI Workshop', 'Hands-on AI workshop for your team', 'training', 3000.00, 480, true, 
 '["Hands-on Exercises", "Real-world Examples", "Certificate of Completion", "Course Materials", "Follow-up Support"]', NOW()),

('Predictive Analytics', 'Build predictive models for business forecasting', 'ai_solutions', 9000.00, 90, true, 
 '["Time Series Analysis", "Demand Forecasting", "Risk Assessment", "Customer Behavior Prediction", "Dashboard Creation"]', NOW()),

('Voice AI Integration', 'Integrate voice recognition and synthesis into your applications', 'ai_solutions', 6500.00, 60, true, 
 '["Speech Recognition", "Voice Synthesis", "Multi-language Support", "Custom Voice Training", "API Development"]', NOW());

-- Insert sample bookings
INSERT INTO bookings (user_id, service_id, booking_date, booking_time, status, notes, created_at) VALUES
(2, 1, CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'confirmed', 'Looking forward to discussing chatbot implementation', NOW()),
(3, 3, CURRENT_DATE + INTERVAL '3 days', '14:00:00', 'confirmed', 'Need consultation for AI strategy in retail', NOW()),
(2, 5, CURRENT_DATE + INTERVAL '14 days', '11:00:00', 'pending', 'Interested in NLP for customer service', NOW()),
(4, 2, CURRENT_DATE + INTERVAL '10 days', '09:00:00', 'pending', 'ML model for sales prediction', NOW()),
(5, 6, CURRENT_DATE + INTERVAL '21 days', '09:00:00', 'confirmed', 'Team workshop for 20 people', NOW()),
(3, 4, CURRENT_DATE + INTERVAL '5 days', '15:00:00', 'confirmed', 'Computer vision for inventory management', NOW());

-- Insert sample leads
INSERT INTO leads (name, email, phone, company, message, source, status, created_at) VALUES
('Michael Brown', 'michael.brown@techcorp.com', '+1-555-0123', 'TechCorp Inc.', 'Interested in AI chatbot for customer support', 'website', 'new', NOW()),
('Sarah Davis', 'sarah.davis@retailco.com', '+1-555-0124', 'RetailCo', 'Need predictive analytics for inventory management', 'referral', 'contacted', NOW()),
('Robert Lee', 'robert.lee@financeplus.com', '+1-555-0125', 'Finance Plus', 'Looking for ML solutions for fraud detection', 'website', 'qualified', NOW()),
('Emma Wilson', 'emma.wilson@healthtech.com', '+1-555-0126', 'HealthTech', 'Interested in computer vision for medical imaging', 'event', 'new', NOW()),
('David Martinez', 'david.martinez@logistics.com', '+1-555-0127', 'Logistics Pro', 'Need AI consultation for route optimization', 'website', 'contacted', NOW()),
('Lisa Anderson', 'lisa.anderson@edutech.com', '+1-555-0128', 'EduTech Solutions', 'Want to implement NLP for educational content', 'social_media', 'qualified', NOW()),
('James Taylor', 'james.taylor@manufacturer.com', '+1-555-0129', 'Manufacturing Co', 'Interested in predictive maintenance solutions', 'website', 'new', NOW()),
('Jennifer White', 'jennifer.white@ecommerce.com', '+1-555-0130', 'E-Commerce Plus', 'Need recommendation engine for our platform', 'referral', 'converted', NOW());

-- Create some showcase items
INSERT INTO showcase_videos (title, description, video_url, thumbnail_url, category, tags, featured, created_at) VALUES
('AI Chatbot Demo', 'See our advanced AI chatbot in action', 'https://example.com/videos/chatbot-demo.mp4', 
 'https://example.com/thumbnails/chatbot.jpg', 'demo', '["chatbot", "ai", "customer service"]', true, NOW()),
 
('Computer Vision in Retail', 'How computer vision transforms retail operations', 'https://example.com/videos/cv-retail.mp4', 
 'https://example.com/thumbnails/cv-retail.jpg', 'case_study', '["computer vision", "retail", "automation"]', true, NOW()),

('ML Model Training Process', 'Behind the scenes of training custom ML models', 'https://example.com/videos/ml-training.mp4', 
 'https://example.com/thumbnails/ml-training.jpg', 'tutorial', '["machine learning", "training", "technical"]', false, NOW());

-- Create sample chat sessions
INSERT INTO chat_sessions (user_id, started_at, ended_at, messages, summary) VALUES
(2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 
 '[{"role": "user", "content": "What AI solutions do you offer?"}, {"role": "assistant", "content": "We offer various AI solutions including chatbots, ML models, computer vision, and NLP services."}]',
 'User inquired about available AI solutions'),
 
(3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes',
 '[{"role": "user", "content": "Can you help with predictive analytics?"}, {"role": "assistant", "content": "Yes, we specialize in predictive analytics for business forecasting, risk assessment, and customer behavior prediction."}]',
 'Discussion about predictive analytics capabilities');

-- Add some metrics data
INSERT INTO metrics (metric_name, metric_value, metric_type, recorded_at) VALUES
('daily_active_users', 125, 'usage', NOW()),
('api_requests', 15420, 'performance', NOW()),
('conversion_rate', 0.23, 'business', NOW()),
('average_response_time', 245, 'performance', NOW()),
('customer_satisfaction', 4.8, 'business', NOW());

-- Print summary
DO $$
BEGIN
    RAISE NOTICE 'Development seed data loaded successfully!';
    RAISE NOTICE 'Test users created (password for all: TestPassword123!):';
    RAISE NOTICE '  - admin@dreamer-ai.com (admin)';
    RAISE NOTICE '  - john.doe@example.com (customer)';
    RAISE NOTICE '  - jane.smith@example.com (customer)';
    RAISE NOTICE '  - bob.wilson@example.com (customer, unverified)';
    RAISE NOTICE '  - alice.johnson@example.com (customer)';
END $$;