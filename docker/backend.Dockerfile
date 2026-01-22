# =============================================================================
# EVALON BACKEND - PRODUCTION DOCKERFILE
# =============================================================================
# Multi-stage build for optimized production image
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY backend/ .

# Stage 2: Production
FROM node:20-alpine AS production

# Add labels
LABEL maintainer="Evalon Team"
LABEL description="Evalon Backend API Server"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S evalon -u 1001

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application
COPY --from=builder --chown=evalon:nodejs /app/src ./src

# Create uploads directory
RUN mkdir -p uploads && chown -R evalon:nodejs uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=5001
ENV REALTIME_PORT=5004

# Expose ports
EXPOSE 5001 5004

# Switch to non-root user
USER evalon

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5001/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the server
CMD ["node", "src/server.js"]





