#!/bin/bash

# Reset NomadGuide Database
# WARNING: This will delete all data!

set -e

echo "⚠️  WARNING: This will delete all database data!"
read -p "Are you sure you want to reset the database? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled."
    exit 1
fi

echo "🗑️  Resetting NomadGuide database..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Stop postgres container
docker compose stop postgres

# Remove postgres data volume
docker volume rm nomadguide_postgres_data || true

# Recreate volume
docker volume create nomadguide_postgres_data

# Start postgres container (will reinitialize)
docker compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to initialize..."
timeout 60 bash -c 'until docker compose exec postgres pg_isready -U dev -d nomadguide; do sleep 2; done'

echo "✅ Database reset complete!"
echo "🔄 Database reinitialized with fresh schema and seed data."
