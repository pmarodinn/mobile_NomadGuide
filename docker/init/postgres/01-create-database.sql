-- NomadGuide Database Initialization
-- This script creates the main database and basic structure

-- Create database (already created by POSTGRES_DB env var)
-- CREATE DATABASE nomadguide;

-- Use the nomadguide database
\c nomadguide;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set default permissions
GRANT ALL PRIVILEGES ON DATABASE nomadguide TO dev;
GRANT ALL PRIVILEGES ON SCHEMA public TO dev;
GRANT ALL PRIVILEGES ON SCHEMA audit TO dev;

-- Print confirmation
SELECT 'NomadGuide database initialized successfully!' as message;
