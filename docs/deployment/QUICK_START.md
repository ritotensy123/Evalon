# Evalon - Quick Start Guide

Get the Evalon exam proctoring platform running in **5 minutes**! ⚡

---

## 🚀 Prerequisites

- **Node.js**: v18+ (v23.10.0 recommended)
- **MongoDB**: v6+ (running locally or connection string)
- **Python**: 3.8+ (for AI service)
- **npm** or **yarn**

---

## ⚡ Quick Start (5 Minutes)

### 1. Clone & Install (2 min)

```bash
# Clone repository
git clone <repository-url>
cd Evalon

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install Python AI service dependencies
cd ../python
pip install -r requirements.txt
```

### 2. Environment Setup (1 min)

```bash
# Backend environment
cd backend
cp env.template .env

# Edit .env with your values (minimum required):
# MONGODB_URI=mongodb://localhost:27017/evalon
# JWT_SECRET=your-super-secret-jwt-key-min-64-chars-long
# SESSION_SECRET=your-session-secret
# FRONTEND_URL=http://localhost:3001
```

```bash
# Frontend environment
cd ../frontend
cp .env.example .env

# Edit .env:
# VITE_API_BASE_URL=http://localhost:5001
# VITE_SOCKET_URL=http://localhost:5004
# VITE_AI_URL=http://localhost:5002
```

### 3. Start Services (2 min)

**Option A: Start All at Once**
```bash
# From project root
cd backend
npm run start:all
```

**Option B: Start Individually (Recommended for Development)**

```bash
# Terminal 1: MongoDB (if not running)
mongod --dbpath /path/to/data

# Terminal 2: Backend API (port 5001)
cd backend
npm run dev

# Terminal 3: Realtime Server (port 5004)
cd backend
node src/realtimeServer.js

# Terminal 4: Python AI Service (port 5002)
cd python
python face_detection_service.py

# Terminal 5: Frontend (port 3001)
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **Realtime Server**: http://localhost:5004
- **AI Service**: http://localhost:5002
- **API Health**: http://localhost:5001/health

---

## ✅ Verification

### Check Services are Running

```bash
# Check Backend API
curl http://localhost:5001/health

# Check AI Service  
curl http://localhost:5002/health

# Check Frontend (in browser)
# Navigate to http://localhost:3001
```

### Expected Responses

**Backend Health:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "service": "evalon-api",
    "timestamp": "2025-12-11T..."
  }
}
```

**AI Service Health:**
```json
{
  "status": "healthy",
  "service": "ai-proctoring",
  "timestamp": "..."
}
```

---

## 🎯 First Steps

### 1. Create Organization Admin

```bash
# Using the backend API
POST http://localhost:5001/api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@organization.com",
  "password": "SecurePass123!",
  "organizationName": "My Organization",
  "userType": "organization-admin"
}
```

### 2. Login

```bash
POST http://localhost:5001/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@organization.com",
  "password": "SecurePass123!"
}
```

### 3. Explore the Dashboard

- Navigate to http://localhost:3001
- Login with your credentials
- Create teachers, students, exams
- Set up proctoring rules

---

## 🔧 Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error**: `MongooseError: Could not connect to any servers`

**Solution**:
```bash
# 1. Check MongoDB is running
mongod --version

# 2. Start MongoDB if not running
mongod --dbpath /path/to/data

# 3. Verify connection string in backend/.env
MONGODB_URI=mongodb://localhost:27017/evalon
```

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5001`

**Solution**:
```bash
# Find process using the port
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5002
```

### Issue: Python Dependencies Missing

**Error**: `ModuleNotFoundError: No module named 'flask'`

**Solution**:
```bash
cd python
pip install -r requirements.txt

# Or with specific Python version
python3 -m pip install -r requirements.txt
```

### Issue: Frontend Build Error

**Error**: `Cannot find module ...`

**Solution**:
```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

## 📚 Next Steps

### For Developers
1. Read [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)
2. Review [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
3. Check [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)

### For Deployment
1. Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Configure PM2 ([backend/ecosystem.config.js](./backend/ecosystem.config.js))
3. Set up Nginx reverse proxy
4. Configure SSL/TLS certificates

### For Testing
1. Run `npm test` in backend directory
2. Run `npm run test:ui` for Playwright UI tests
3. Check test coverage with `npm run test:coverage`

---

## 🌟 Features Overview

### Core Features
- ✅ **User Management**: Multi-tenant organizations, teachers, students
- ✅ **Exam Creation**: Question banks, randomization, time limits
- ✅ **Real-time Proctoring**: Camera, screen share, AI analysis
- ✅ **AI Detection**: Face detection, behavior analysis, anomaly detection
- ✅ **Results & Analytics**: Automated grading, detailed reports

### Security Features
- ✅ **JWT Authentication**: Token-based auth with refresh
- ✅ **Rate Limiting**: 4-tier protection
- ✅ **Input Validation**: Comprehensive validation
- ✅ **CORS Protection**: Configurable origins
- ✅ **Helmet Security**: HTTP headers protection

### Monitoring Features
- ✅ **Health Checks**: Liveness & readiness probes
- ✅ **Structured Logging**: Winston with request IDs
- ✅ **Error Tracking**: Comprehensive error handling
- ✅ **Performance Metrics**: Ready for APM integration

---

## 🎓 Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Backend API │────▶│   MongoDB   │
│  (React)    │     │  (Express)   │     │  (Database) │
│  Port 3001  │     │  Port 5001   │     └─────────────┘
└─────────────┘     └──────────────┘              
       │                    │                     
       │                    │                     
       ▼                    ▼                     
┌─────────────┐     ┌──────────────┐            
│  Realtime   │     │  AI Service  │            
│  (Socket.IO)│     │  (Python)    │            
│  Port 5004  │     │  Port 5002   │            
└─────────────┘     └──────────────┘            
```

---

## 📞 Support & Resources

### Documentation
- **Full Documentation**: See [README.md](./README.md)
- **API Reference**: See [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Health Endpoints
- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

### Monitoring
- **Logs**: `backend/logs/` directory
- **PM2 Status**: `pm2 status`
- **MongoDB**: `mongo evalon --eval "db.stats()"`

---

## 🎉 Success!

You now have Evalon running locally! 

**What's Next?**
1. Create your first exam
2. Add some questions
3. Invite students
4. Start proctored exam
5. Review AI analysis results

**Need Help?**
- Check [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) for current status
- Review [PROJECT_STATUS_DASHBOARD.md](./PROJECT_STATUS_DASHBOARD.md) for metrics
- See [ULTIMATE_SESSION_ACHIEVEMENTS.md](./ULTIMATE_SESSION_ACHIEVEMENTS.md) for detailed info

---

**Happy Testing!** 🚀

*Guide Version: 1.0.0*  
*Last Updated: December 11, 2025*

