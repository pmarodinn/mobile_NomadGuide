#!/bin/bash

# Stop NomadGuide Development Environment
# This script stops all running containers

set -e

echo "🛑 Stopping NomadGuide development environment..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Stop all containers
docker compose down

echo "✅ Development environment stopped!"
echo ""
echo "To start again, run: ./scripts/start-dev.sh"
