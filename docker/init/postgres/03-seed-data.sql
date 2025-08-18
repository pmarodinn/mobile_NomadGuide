-- NomadGuide Development Seed Data
-- This script creates test data for development

\c nomadguide;

-- Create a test user (password: 'password123')
INSERT INTO users (id, email, password_hash, email_verified, is_active) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'test@nomadguide.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZe.vXe8X9fZLKx2', -- bcrypt hash of 'password123'
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Create test user profile
INSERT INTO user_profiles (user_id, first_name, last_name, nationality, primary_language, primary_currency, timezone) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Test',
    'User',
    'US',
    'en',
    'USD',
    'America/New_York'
) ON CONFLICT DO NOTHING;

-- Create test budget
INSERT INTO budgets (user_id, name, total_amount, currency, start_date, end_date, is_active) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Europe Trip 2025',
    5000.00,
    'USD',
    '2025-08-17',
    '2025-12-31',
    TRUE
) ON CONFLICT DO NOTHING;

-- Print confirmation
SELECT 'Development seed data inserted successfully!' as message;
SELECT 'Test user created: test@nomadguide.com (password: password123)' as message;
