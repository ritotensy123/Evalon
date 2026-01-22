# =============================================================================
# EVALON FRONTEND - PRODUCTION DOCKERFILE
# =============================================================================
# Multi-stage build for optimized production image
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build arguments for environment
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ARG VITE_AI_URL

# Build the application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Add labels
LABEL maintainer="Evalon Team"
LABEL description="Evalon Frontend Application"
LABEL version="1.0.0"

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]





