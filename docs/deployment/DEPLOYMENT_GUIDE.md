# Evalon Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Evalon exam proctoring platform to production.

---

## Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account or MongoDB instance
- PM2 (for process management)
- Environment variables configured

---

## 1. Environment Setup

### 1.1 Copy Environment Template
```bash
cp backend/env.template backend/.env
cp frontend/.env.example frontend/.env
```

### 1.2 Configure Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=5001
REALTIME_PORT=5004
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evalon

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Email (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Service
AI_SERVICE_URL=http://localhost:5002

# Logging
LOG_LEVEL=info
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://realtime.yourdomain.com
VITE_AI_URL=https://ai.yourdomain.com
```

---

## 2. Database Setup

### 2.1 Validate Database Connection
```bash
cd backend
npm run validate
```

This will:
- Check environment variables
- Validate database connection
- Perform health checks
- Auto-fix common issues

### 2.2 Database Requirements
- Database name MUST be: `evalon`
- Collections will be created automatically
- Indexes will be validated on startup

---

## 3. Backend Deployment

### 3.1 Install Dependencies
```bash
cd backend
npm install --production
```

### 3.2 Build (if needed)
```bash
# No build step required for Node.js backend
```

### 3.3 Start with PM2
```bash
# Start all services
pm2 start ecosystem.config.js --env production

# Or start individually
pm2 start ecosystem.config.js --only evalon-api --env production
pm2 start ecosystem.config.js --only evalon-realtime --env production
```

### 3.4 PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs evalon-api
pm2 logs evalon-realtime

# Restart
pm2 restart evalon-api

# Stop
pm2 stop evalon-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

---

## 4. Frontend Deployment

### 4.1 Install Dependencies
```bash
cd frontend
npm install
```

### 4.2 Build for Production
```bash
npm run build
```

### 4.3 Serve with Nginx (Recommended)

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    root /path/to/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket Proxy
    location /socket.io {
        proxy_pass http://localhost:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 5. Python AI Service Deployment

### 5.1 Install Dependencies
```bash
cd python
pip install -r requirements.txt
```

### 5.2 Configure Environment
```env
PORT=5002
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
FLASK_DEBUG=false
```

### 5.3 Start with PM2
```bash
pm2 start python/face_detection_service.py --name evalon-ai --interpreter python3
```

---

## 6. Health Checks

### 6.1 API Health
```bash
curl https://api.yourdomain.com/health
```

### 6.2 Detailed Health
```bash
curl https://api.yourdomain.com/health/detailed
```

### 6.3 Liveness Probe
```bash
curl https://api.yourdomain.com/health/live
```

### 6.4 Readiness Probe
```bash
curl https://api.yourdomain.com/health/ready
```

---

## 7. Monitoring

### 7.1 PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View metrics
pm2 show evalon-api
```

### 7.2 Log Management
```bash
# View logs
pm2 logs

# Log rotation (install pm2-logrotate)
pm2 install pm2-logrotate
```

### 7.3 Application Monitoring
- Health check endpoints available
- Winston logging configured
- Request ID tracking enabled
- Error tracking ready for integration (Sentry, etc.)

---

## 8. Security Checklist

- [ ] All environment variables set
- [ ] JWT_SECRET is strong (min 32 characters)
- [ ] SESSION_SECRET is strong (min 32 characters)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Database credentials secure
- [ ] Firewall rules configured
- [ ] Regular backups scheduled
- [ ] Error logging configured

---

## 9. Backup Strategy

### 9.1 Database Backup
```bash
# MongoDB Atlas: Use automated backups
# Or manual backup:
mongodump --uri="mongodb+srv://..." --db=evalon --out=./backup
```

### 9.2 Application Backup
- Environment files
- Uploaded files (`backend/uploads/`)
- PM2 configuration

---

## 10. Troubleshooting

### 10.1 Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :5001

# Kill the process
kill -9 <PID>
```

#### Database Connection Failed
- Check MONGODB_URI
- Verify network access
- Check database name (must be 'evalon')

#### CORS Errors
- Verify ALLOWED_ORIGINS includes frontend URL
- Check FRONTEND_URL matches actual frontend URL

### 10.2 Logs
```bash
# Backend logs
pm2 logs evalon-api
pm2 logs evalon-realtime

# System logs
journalctl -u your-service
```

---

## 11. Scaling

### 11.1 Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple PM2 instances
- Database connection pooling configured

### 11.2 Vertical Scaling
- Increase PM2 instances: `instances: 'max'`
- Adjust memory limits in ecosystem.config.js
- Optimize database indexes

---

## 12. Updates & Maintenance

### 12.1 Update Process
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run validation
npm run validate

# 4. Restart services
pm2 restart all

# 5. Verify health
curl https://api.yourdomain.com/health
```

### 12.2 Zero-Downtime Deployment
```bash
# Graceful reload (zero downtime)
pm2 reload evalon-api
pm2 reload evalon-realtime
```

---

## 13. Performance Optimization

### 13.1 Database
- Indexes validated on startup
- Connection pooling optimized
- Query optimization recommended

### 13.2 Application
- Compression enabled
- Rate limiting configured
- Request timeouts set
- Health checks available

---

## 14. Support & Resources

- Health Check: `/health`
- API Documentation: Check routes files
- Error Logs: PM2 logs
- Database Health: `/health/detailed`

---

**Last Updated**: Current session
**Status**: Production Ready

