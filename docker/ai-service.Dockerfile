# =============================================================================
# EVALON AI SERVICE - PRODUCTION DOCKERFILE
# =============================================================================
# Python Flask service for AI-powered face detection and proctoring
# =============================================================================

FROM python:3.11-slim

# Add labels
LABEL maintainer="Evalon Team"
LABEL description="Evalon AI Proctoring Service"
LABEL version="1.0.0"

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash evalon

WORKDIR /app

# Copy requirements first for caching
COPY python/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY python/face_detection_service.py .
COPY python/suspicious_activity_model.h5 .

# Set permissions
RUN chown -R evalon:evalon /app

# Set environment
ENV PORT=5002
ENV FLASK_DEBUG=false

# Expose port
EXPOSE 5002

# Switch to non-root user
USER evalon

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5002/health')" || exit 1

# Start the service with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--workers", "2", "--timeout", "120", "face_detection_service:app"]





