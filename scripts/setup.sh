#!/bin/bash

# NomadGuide Development Environment Setup
# This script sets up the initial development environment

set -e

echo "🚀 Setting up NomadGuide development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please review and modify as needed."
fi

# Pull required images
echo "📦 Pulling Docker images..."
docker compose pull postgres pgadmin

# Create volumes
echo "💾 Creating Docker volumes..."
docker volume create nomadguide_postgres_data || true
docker volume create nomadguide_pgadmin_data || true

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and modify docker/.env file if needed"
echo "2. Run './scripts/start-dev.sh' to start the development environment"
echo "3. Access pgAdmin at http://localhost:5050 (admin@nomadguide.com / admin123)"
