# 🐳 NomadGuide - Docker Development Environment

**Project:** NomadGuide Mobile Application  
**Strategy:** Hybrid Containerized Development  
**Last Updated:** August 17, 2025  

---

## 📋 Table of Contents

1. [Docker Strategy Overview](#-docker-strategy-overview)
2. [Architecture Components](#-architecture-components)
3. [Project Structure](#-project-structure)
4. [Docker Compose Services](#-docker-compose-services)
5. [Development Workflow](#-development-workflow)
6. [Environment Configuration](#-environment-configuration)
7. [Installation Guide](#-installation-guide)
8. [Usage Commands](#-usage-commands)
9. [Troubleshooting](#-troubleshooting)
10. [Production Considerations](#-production-considerations)

---

## 🎯 Docker Strategy Overview

### **Hybrid Development Approach**

**Containerized Components:**
- ✅ **PostgreSQL Database** - Isolated, consistent database environment
- ✅ **Backend API Server** - Node.js/Spring Boot/Django in container
- ✅ **pgAdmin** - Web-based database administration
- ✅ **Redis** (Future) - Caching and session management
- ✅ **File Storage** (Future) - MinIO or AWS S3 compatible

**Local Components:**
- 🖥️ **Android Studio** - Native Android development environment
- 🖥️ **Android Emulator** - Better performance when local
- 🖥️ **IDE** - VS Code or IntelliJ for backend development

### **Why This Strategy?**

**Containerized Backend Benefits:**
- 🔄 **Consistent Environment** - Same setup across all developers
- 🚀 **Quick Setup** - One command to start entire backend
- 🧹 **Easy Cleanup** - Remove containers without affecting system
- 📦 **Production Parity** - Development mirrors production closely
- 🔒 **Isolation** - Services don't interfere with host system

**Local Android Benefits:**
- ⚡ **Performance** - Emulator runs faster on host OS
- 🔧 **Direct Access** - Direct USB debugging with physical devices
- 💾 **Resource Usage** - Better memory and CPU management
- 🛠️ **Tooling** - Full Android Studio features and plugins

---

## 🏗️ Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                      HOST MACHINE                           │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Android Studio │    │         DOCKER CONTAINERS       │ │
│  │                 │    │  ┌─────────────────────────────┐ │ │
│  │  - Kotlin Code  │    │  │       Backend API           │ │ │
│  │  - UI Layouts   │◄───┼──┤  (Node.js/Spring/Django)   │ │ │
│  │  - Resources    │    │  │  Port: 3000/8080            │ │ │
│  │  - Tests        │    │  └─────────────────────────────┘ │ │
│  └─────────────────┘    │  ┌─────────────────────────────┐ │ │
│                         │  │       PostgreSQL            │ │ │
│  ┌─────────────────┐    │  │  Database: nomadguide       │ │ │
│  │   VS Code/IDE   │    │  │  Port: 5432                 │ │ │
│  │                 │◄───┼──│  User: dev / Pass: dev123   │ │ │
│  │  - Backend Code │    │  └─────────────────────────────┘ │ │
│  │  - API Docs     │    │  ┌─────────────────────────────┐ │ │
│  │  - Tests        │    │  │        pgAdmin              │ │ │
│  └─────────────────┘    │  │  Web UI: localhost:5050     │ │ │
│                         │  │  Database Management        │ │ │
│                         │  └─────────────────────────────┘ │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
mobile_NomadGuide/
├── README.md
├── DEVELOPMENT_CHECKLIST.md
├── DOCKER_SETUP.md                    # This file
├── NomadGuide_Product_Specification.md
├── NomadGuide_Database_Architecture.md
│
├── docker/                            # Docker configuration
│   ├── docker-compose.yml            # Main orchestration
│   ├── docker-compose.dev.yml        # Development overrides
│   ├── docker-compose.prod.yml       # Production configuration
│   ├── .env.example                  # Environment template
│   └── init/                         # Initialization scripts
│       ├── postgres/                 # Database init scripts
│       │   ├── 01-create-database.sql
│       │   ├── 02-create-schemas.sql
│       │   └── 03-seed-data.sql
│       └── pgadmin/                  # pgAdmin configuration
│           └── servers.json
│
├── backend/                          # Backend API source
│   ├── Dockerfile                   # Backend container definition
│   ├── .dockerignore               # Docker ignore rules
│   ├── package.json                # Dependencies (Node.js)
│   ├── pom.xml                     # Dependencies (Spring Boot)
│   ├── requirements.txt            # Dependencies (Django)
│   ├── src/                        # Source code
│   ├── tests/                      # Backend tests
│   └── docs/                       # API documentation
│
├── android/                         # Android application
│   ├── app/                        # Main Android app module
│   ├── build.gradle               # Android build configuration
│   ├── gradle.properties          # Gradle properties
│   └── local.properties           # Local SDK paths
│
├── scripts/                        # Development scripts
│   ├── setup.sh                   # Initial environment setup
│   ├── start-dev.sh              # Start development environment
│   ├── stop-dev.sh               # Stop development environment
│   ├── reset-db.sh               # Reset database
│   ├── backup-db.sh              # Backup database
│   └── logs.sh                   # View container logs
│
├── docs/                          # Additional documentation
│   ├── api/                      # API documentation
│   ├── database/                 # Database documentation
│   └── deployment/               # Deployment guides
│
└── tests/                        # Integration tests
    ├── api/                     # API integration tests
    ├── database/                # Database tests
    └── e2e/                     # End-to-end tests
```

---

## 🐳 Docker Compose Services

### **Main Services Configuration**

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: nomadguide_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: nomadguide
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init/postgres:/docker-entrypoint-initdb.d
    networks:
      - nomadguide_network

  # pgAdmin Database Management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: nomadguide_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@nomadguide.com
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
      - ./init/pgadmin/servers.json:/pgadmin4/servers.json
    depends_on:
      - postgres
    networks:
      - nomadguide_network

  # Backend API Server
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
      target: development
    container_name: nomadguide_backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://dev:dev123@postgres:5432/nomadguide
      JWT_SECRET: dev_jwt_secret_key_change_in_production
      API_PORT: 3000
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debug port
    volumes:
      - ../backend:/app
      - /app/node_modules  # Anonymous volume for node_modules
    depends_on:
      - postgres
    networks:
      - nomadguide_network
    command: npm run dev

  # Redis Cache (Future Implementation)
  redis:
    image: redis:7-alpine
    container_name: nomadguide_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - nomadguide_network
    profiles:
      - full  # Only start with --profile full

volumes:
  postgres_data:
    name: nomadguide_postgres_data
  pgadmin_data:
    name: nomadguide_pgadmin_data
  redis_data:
    name: nomadguide_redis_data

networks:
  nomadguide_network:
    name: nomadguide_network
    driver: bridge
```

### **Development Override Configuration**

```yaml
# docker/docker-compose.dev.yml
version: '3.8'

services:
  backend:
    build:
      target: development
    environment:
      NODE_ENV: development
      DEBUG: nomadguide:*
      LOG_LEVEL: debug
    volumes:
      - ../backend:/app
      - /app/node_modules
    command: npm run dev:watch

  postgres:
    environment:
      POSTGRES_DB: nomadguide_dev
    ports:
      - "5433:5432"  # Different port for dev
```

---

## ⚙️ Environment Configuration

### **Environment Variables**

```bash
# docker/.env.example
# Database Configuration
POSTGRES_DB=nomadguide
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev123
POSTGRES_PORT=5432

# pgAdmin Configuration
PGADMIN_EMAIL=admin@nomadguide.com
PGADMIN_PASSWORD=admin123

# Backend Configuration
NODE_ENV=development
API_PORT=3000
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000

# External API Keys
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
MAPS_API_KEY=your_maps_api_key

# File Upload Configuration
MAX_FILE_SIZE=10MB
UPLOAD_PATH=/uploads

# Email Configuration (Future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Installation Guide

### **Prerequisites**

```bash
# Check system requirements
docker --version          # Should be 20.10+
docker-compose --version  # Should be 2.0+
git --version             # For version control
```

### **Step 1: Install Docker**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker run hello-world
```

### **Step 2: Clone and Setup Project**

```bash
# Clone repository
git clone <repository-url>
cd mobile_NomadGuide

# Copy environment configuration
cp docker/.env.example docker/.env

# Make scripts executable
chmod +x scripts/*.sh

# Run initial setup
./scripts/setup.sh
```

### **Step 3: Start Development Environment**

```bash
# Start all services
./scripts/start-dev.sh

# Or manually
cd docker
docker-compose up -d
```

### **Step 4: Verify Installation**

```bash
# Check running containers
docker ps

# Check logs
docker-compose logs backend
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U dev -d nomadguide -c "\dt"

# Access pgAdmin
# Open browser: http://localhost:5050
# Login: admin@nomadguide.com / admin123
```

---

## 💻 Usage Commands

### **Daily Development Commands**

```bash
# Start development environment
./scripts/start-dev.sh

# Stop development environment
./scripts/stop-dev.sh

# View logs
./scripts/logs.sh [service_name]

# Reset database (careful!)
./scripts/reset-db.sh

# Backup database
./scripts/backup-db.sh
```

### **Docker Compose Commands**

```bash
# Start services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# Start specific service
docker-compose up -d postgres

# View service logs
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec postgres psql -U dev -d nomadguide
docker-compose exec backend npm run test
```

### **Database Management**

```bash
# Connect to database
docker-compose exec postgres psql -U dev -d nomadguide

# Run SQL file
docker-compose exec -T postgres psql -U dev -d nomadguide < backup.sql

# Create database backup
docker-compose exec postgres pg_dump -U dev nomadguide > backup.sql

# Reset database
docker-compose down -v postgres
docker-compose up -d postgres
```

---

## 🔧 Development Workflow

### **Daily Development Routine**

1. **Start Environment**
   ```bash
   ./scripts/start-dev.sh
   ```

2. **Check Service Health**
   ```bash
   docker ps
   curl http://localhost:3000/health
   ```

3. **Development Work**
   - Backend changes: Hot-reload automatically
   - Database changes: Apply migrations
   - Android: Use Android Studio locally

4. **Testing**
   ```bash
   docker-compose exec backend npm test
   ```

5. **Stop Environment**
   ```bash
   ./scripts/stop-dev.sh
   ```

### **Backend Development**

```bash
# Install new dependencies
docker-compose exec backend npm install package-name

# Run migrations
docker-compose exec backend npm run migrate

# Generate API documentation
docker-compose exec backend npm run docs

# Run tests
docker-compose exec backend npm run test:watch
```

### **Database Development**

```bash
# Create migration
docker-compose exec backend npm run migration:create add_user_table

# Run migrations
docker-compose exec backend npm run migrate

# Rollback migration
docker-compose exec backend npm run migrate:rollback

# Seed database
docker-compose exec backend npm run seed
```

---

## 🐛 Troubleshooting

### **Common Issues**

**Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :5432
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different ports in docker-compose.yml
```

**Permission Errors**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

**Database Connection Issues**
```bash
# Check postgres logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U dev -l

# Test connection
docker-compose exec postgres psql -U dev -d nomadguide -c "SELECT 1;"
```

**Container Build Issues**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build --dry-run .
```

### **Performance Issues**

**Slow Container Startup**
```bash
# Check system resources
docker stats

# Increase Docker memory allocation
# Docker Desktop: Settings > Resources > Memory: 4GB+
```

**Slow Database Queries**
```bash
# Enable query logging
# Add to docker-compose.yml postgres service:
# command: postgres -c log_statement=all
```

---

## 🚀 Production Considerations

### **Production Docker Compose**

```yaml
# docker/docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build:
      target: production
    environment:
      NODE_ENV: production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    environment:
      POSTGRES_DB: nomadguide_prod
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_prod_data:
    external: true
```

### **Security Considerations**

- **Environment Variables**: Use Docker secrets in production
- **Network Security**: Use custom networks, avoid exposing unnecessary ports
- **Image Security**: Use official images, regular updates
- **Data Persistence**: Use named volumes or bind mounts with proper permissions
- **Health Checks**: Implement comprehensive health checks
- **Logging**: Configure proper log management
- **Backup Strategy**: Automated database backups

### **Deployment Strategy**

1. **Staging Environment**: Mirror production setup
2. **CI/CD Integration**: Automated builds and deployments
3. **Rolling Updates**: Zero-downtime deployments
4. **Monitoring**: Container and application monitoring
5. **Scaling**: Horizontal scaling with load balancers

---

## 📊 Progress Tracking

### **Docker Setup Progress**

| Component | Status | Progress | Notes |
|-----------|--------|----------|-------|
| Docker Compose Configuration | 🔴 | 0% | Main orchestration file |
| PostgreSQL Container | 🔴 | 0% | Database setup |
| pgAdmin Container | 🔴 | 0% | Database management UI |
| Backend Container | 🔴 | 0% | API server container |
| Development Scripts | 🔴 | 0% | Automation scripts |
| Environment Configuration | 🔴 | 0% | .env and configs |
| Documentation | 🟡 | 80% | This document |
| Testing & Validation | 🔴 | 0% | Setup verification |

### **Integration Status**

| Integration Point | Status | Priority | Notes |
|------------------|--------|----------|-------|
| Android Studio Connection | 🔴 | High | API communication setup |
| Database Migrations | 🔴 | High | Schema management |
| API Documentation | 🔴 | Medium | Swagger/OpenAPI setup |
| Local Development Workflow | 🔴 | High | Developer experience |
| CI/CD Pipeline | 🔴 | Low | Automated deployments |

---

**Last Updated:** August 17, 2025  
**Next Review:** August 24, 2025  
**Maintainer:** NomadGuide Development Team
