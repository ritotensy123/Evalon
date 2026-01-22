# =============================================================================
# EVALON - MAKEFILE
# =============================================================================
# Common development and deployment commands
# Usage: make [command]
# =============================================================================

.PHONY: help install dev build test clean docker-build docker-up docker-down logs

# Default target
help:
	@echo "╔═══════════════════════════════════════════════════════════════╗"
	@echo "║                    EVALON - Make Commands                     ║"
	@echo "╠═══════════════════════════════════════════════════════════════╣"
	@echo "║ Development:                                                  ║"
	@echo "║   make install     - Install all dependencies                 ║"
	@echo "║   make dev         - Start development servers                ║"
	@echo "║   make dev-backend - Start only backend services              ║"
	@echo "║   make dev-frontend- Start only frontend                      ║"
	@echo "║                                                               ║"
	@echo "║ Testing:                                                      ║"
	@echo "║   make test        - Run all tests                            ║"
	@echo "║   make test-backend- Run backend tests                        ║"
	@echo "║   make test-e2e    - Run end-to-end tests                     ║"
	@echo "║                                                               ║"
	@echo "║ Docker:                                                       ║"
	@echo "║   make docker-build- Build all Docker images                  ║"
	@echo "║   make docker-up   - Start all services with Docker           ║"
	@echo "║   make docker-down - Stop all Docker services                 ║"
	@echo "║   make docker-logs - View Docker logs                         ║"
	@echo "║                                                               ║"
	@echo "║ Production:                                                   ║"
	@echo "║   make build       - Build for production                     ║"
	@echo "║   make start       - Start production servers                 ║"
	@echo "║                                                               ║"
	@echo "║ Maintenance:                                                  ║"
	@echo "║   make clean       - Clean build artifacts                    ║"
	@echo "║   make validate    - Validate configuration                   ║"
	@echo "║   make health      - Check service health                     ║"
	@echo "╚═══════════════════════════════════════════════════════════════╝"

# =============================================================================
# DEVELOPMENT
# =============================================================================

install:
	@echo "📦 Installing all dependencies..."
	cd frontend && npm install
	cd backend && npm install
	cd python && pip install -r requirements.txt
	@echo "✅ All dependencies installed"

dev:
	@echo "🚀 Starting development servers..."
	@make -j3 dev-backend-api dev-backend-realtime dev-frontend

dev-backend-api:
	cd backend && npm run dev

dev-backend-realtime:
	cd backend && npm run start:realtime

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	@echo "🚀 Starting backend services..."
	cd backend && npm run start:all

dev-ai:
	@echo "🧠 Starting AI service..."
	cd python && python face_detection_service.py

# =============================================================================
# TESTING
# =============================================================================

test:
	@echo "🧪 Running all tests..."
	cd backend && npm test
	@echo "✅ All tests completed"

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && npm test

test-e2e:
	@echo "🧪 Running E2E tests..."
	cd backend && npm run test:headed

# =============================================================================
# DOCKER
# =============================================================================

docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d
	@echo "✅ Services started"
	@make docker-health

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-health:
	@echo "🏥 Checking service health..."
	@sleep 5
	@curl -s http://localhost:5001/api/v1/health | head -c 100 || echo "Backend not ready"
	@curl -s http://localhost:5002/health | head -c 100 || echo "AI Service not ready"
	@echo ""

docker-restart:
	docker-compose restart

docker-clean:
	docker-compose down -v --rmi local

# =============================================================================
# PRODUCTION
# =============================================================================

build:
	@echo "🏗️ Building for production..."
	cd frontend && npm run build
	@echo "✅ Build completed"

start:
	@echo "🚀 Starting production servers..."
	cd backend && npm run start:all

start-pm2:
	@echo "🚀 Starting with PM2..."
	cd backend && pm2 start ecosystem.config.js --env production

stop-pm2:
	pm2 stop evalon-api evalon-realtime

# =============================================================================
# MAINTENANCE
# =============================================================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf frontend/build
	rm -rf frontend/node_modules/.cache
	rm -rf backend/coverage
	rm -rf backend/playwright-report
	rm -rf backend/test-results
	rm -rf python/__pycache__
	@echo "✅ Cleanup completed"

validate:
	@echo "🔍 Validating configuration..."
	cd backend && npm run validate
	@echo "✅ Validation completed"

health:
	@echo "🏥 Checking service health..."
	@echo "\n📊 Backend API:"
	@curl -s http://localhost:5001/api/v1/health || echo "Not running"
	@echo "\n\n📊 AI Service:"
	@curl -s http://localhost:5002/health || echo "Not running"
	@echo "\n"

lint:
	@echo "🔍 Running linters..."
	cd backend && npm run lint 2>/dev/null || echo "No lint script configured"
	cd frontend && npm run lint 2>/dev/null || echo "No lint script configured"

# =============================================================================
# UTILITIES
# =============================================================================

# Quick check if services are running
status:
	@echo "📊 Service Status:"
	@lsof -i :5001 2>/dev/null && echo "✅ Backend API (5001)" || echo "❌ Backend API (5001)"
	@lsof -i :5004 2>/dev/null && echo "✅ Realtime (5004)" || echo "❌ Realtime (5004)"
	@lsof -i :5002 2>/dev/null && echo "✅ AI Service (5002)" || echo "❌ AI Service (5002)"
	@lsof -i :3001 2>/dev/null && echo "✅ Frontend (3001)" || echo "❌ Frontend (3001)"

# Kill all services on development ports
kill-all:
	@echo "🔪 Killing all services..."
	@lsof -ti:5001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5004 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5002 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@echo "✅ All services killed"






