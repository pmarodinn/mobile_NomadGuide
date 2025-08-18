-- NomadGuide Schema Creation
-- This script creates the basic table structure

\c nomadguide;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    nationality VARCHAR(3), -- ISO country code
    primary_language VARCHAR(5) DEFAULT 'en', -- ISO language code
    primary_currency VARCHAR(3) DEFAULT 'USD', -- ISO currency code
    timezone VARCHAR(50) DEFAULT 'UTC',
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_allowance DECIMAL(12,2) GENERATED ALWAYS AS (
        total_amount / GREATEST(1, (end_date - start_date + 1))
    ) STORED,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description, icon, color, is_default) VALUES
('Food', 'Meals, groceries, and dining', '🍽️', '#FF6B6B', TRUE),
('Transportation', 'Public transport, taxis, flights', '🚗', '#4ECDC4', TRUE),
('Accommodation', 'Hotels, Airbnb, hostels', '🏨', '#45B7D1', TRUE),
('Entertainment', 'Movies, tours, activities', '🎭', '#96CEB4', TRUE),
('Shopping', 'Clothes, electronics, souvenirs', '🛍️', '#FECA57', TRUE),
('Healthcare', 'Medical expenses, pharmacy', '⚕️', '#FF9FF3', TRUE),
('Education', 'Courses, books, learning', '📚', '#54A0FF', TRUE),
('Miscellaneous', 'Other expenses', '📦', '#5F27CD', TRUE)
ON CONFLICT DO NOTHING;

-- Print confirmation
SELECT 'Basic schema created successfully!' as message;
SELECT 'Default categories inserted!' as message;
