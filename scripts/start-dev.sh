#!/bin/bash

# Start NomadGuide Development Environment
# This script starts the PostgreSQL and pgAdmin containers

set -e

echo "🚀 Starting NomadGuide development environment..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Start PostgreSQL and pgAdmin (without backend for now)
echo "🐳 Starting PostgreSQL and pgAdmin containers..."
docker compose up -d postgres pgadmin

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout 60 bash -c 'until docker compose exec postgres pg_isready -U dev -d nomadguide; do sleep 2; done'

echo "✅ Development environment is ready!"
echo ""
echo "Services running:"
echo "📊 PostgreSQL: localhost:5432 (user: dev, db: nomadguide)"
echo "🔧 pgAdmin: http://localhost:5050 (admin@nomadguide.com / admin123)"
echo ""
echo "Useful commands:"
echo "  ./scripts/stop-dev.sh    - Stop development environment"
echo "  ./scripts/logs.sh        - View container logs"
echo "  ./scripts/reset-db.sh    - Reset database"
