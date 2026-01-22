# Evalon - AI-Powered Exam Proctoring Platform

A comprehensive exam proctoring platform with AI-powered monitoring, real-time proctoring, and comprehensive exam management.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (Atlas or local instance)
- Python 3.8+ (for AI service)
- PM2 (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Evalon
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.template .env
   # Edit .env with your configuration
   npm run validate  # Validate setup
   npm run dev       # Start development server
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Python AI Service**
   ```bash
   cd python
   pip install -r requirements.txt
   # Set PORT in .env
   python face_detection_service.py
   ```

## 📁 Project Structure

```
Evalon/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   ├── server.js      # Main API server
│   │   └── realtimeServer.js # WebSocket server
│   └── ecosystem.config.js # PM2 configuration
├── frontend/             # React frontend
│   └── src/
│       ├── components/   # React components
│       ├── config/        # Configuration
│       ├── services/      # API services
│       └── utils/         # Utilities
├── python/               # Python AI service
│   └── face_detection_service.py
└── Documentation/
    ├── IMPROVEMENTS_SUMMARY.md
    ├── DEPLOYMENT_GUIDE.md
    ├── DEVELOPER_QUICK_REFERENCE.md
    └── PROJECT_STATUS_REPORT.md
```

## 🎯 Features

### Core Features
- ✅ **User Management** - Organizations, teachers, students
- ✅ **Exam Management** - Create, schedule, and manage exams
- ✅ **Question Banks** - Organize and manage questions
- ✅ **Real-time Proctoring** - AI-powered monitoring
- ✅ **Exam Sessions** - Live exam monitoring
- ✅ **Activity Logging** - Comprehensive audit trail

### Technical Features
- ✅ **RESTful API** - Standardized API responses
- ✅ **WebSocket** - Real-time communication
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Rate Limiting** - Multiple tiers for security
- ✅ **Input Validation** - Comprehensive validation
- ✅ **Error Handling** - Global error handler
- ✅ **Health Checks** - Comprehensive monitoring
- ✅ **Graceful Shutdown** - Zero-downtime deployments
- ✅ **Query Optimization** - Database indexes
- ✅ **Logging** - Winston structured logging

## 📚 Documentation

- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - Complete list of all improvements
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)** - Developer quick reference
- **[PROJECT_STATUS_REPORT.md](./PROJECT_STATUS_REPORT.md)** - Current project status

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5001
REALTIME_PORT=5004
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://...

# Security
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Frontend
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# AI Service
AI_SERVICE_URL=http://localhost:5002

# Logging
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
SLOW_QUERY_THRESHOLD_MS=100
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://realtime.yourdomain.com
VITE_AI_URL=https://ai.yourdomain.com
```

## 🚀 Deployment

### Production Deployment

1. **Validate Setup**
   ```bash
   cd backend
   npm run validate
   ```

2. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

3. **Monitor**
   ```bash
   pm2 monit
   pm2 logs
   ```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🏥 Health Checks

- **Basic**: `GET /health`
- **Detailed**: `GET /health/detailed`
- **Liveness**: `GET /health/live`
- **Readiness**: `GET /health/ready`

## 🔒 Security

- ✅ JWT authentication
- ✅ Rate limiting (multiple tiers)
- ✅ Input validation
- ✅ Request timeouts
- ✅ CORS configuration
- ✅ File upload security
- ✅ Environment-based configuration

## 📊 Monitoring

- ✅ PM2 process management
- ✅ Health check endpoints
- ✅ Database health monitoring
- ✅ Query performance logging
- ✅ Winston structured logging
- ✅ Request ID tracking

## 🛠️ Development

### Backend
```bash
cd backend
npm run dev          # Development server
npm run validate     # Validate setup
npm test            # Run tests
```

### Frontend
```bash
cd frontend
npm run dev         # Development server
npm run build       # Production build
```

## 📈 Performance

- ✅ Database connection pooling
- ✅ Query optimization (22+ indexes)
- ✅ Request timeout protection
- ✅ Compression enabled
- ✅ Query logging (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -i :5001
   kill -9 <PID>
   ```

2. **Database Connection Failed**
   - Check MONGODB_URI
   - Verify database name is 'evalon'
   - Check network access

3. **CORS Errors**
   - Verify ALLOWED_ORIGINS includes frontend URL
   - Check FRONTEND_URL matches actual URL

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for more troubleshooting tips.

## 📝 API Documentation

### Base URL
- **API**: `http://localhost:5001/api/v1`
- **Realtime**: `http://localhost:5004`
- **AI Service**: `http://localhost:5002`

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "requestId": "req_1234567890",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎯 Project Status

**Progress: 39/50 tasks completed (78%)**

### ✅ Completed
- Infrastructure & Configuration
- Logging & Monitoring
- Error Handling
- Security & Validation
- Database & Uploads
- Controllers & Services
- Frontend API Client
- Graceful Shutdown
- Code Quality

### ⏳ Remaining
- Frontend routing (React Router)
- WebSocket enhancements
- Additional optimizations

See [PROJECT_STATUS_REPORT.md](./PROJECT_STATUS_REPORT.md) for detailed status.

## 🤝 Contributing

1. Follow the code standards
2. Use standardized responses
3. Add input validation
4. Use logger instead of console.log
5. Follow the project structure

See [DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md) for development guidelines.

## 📄 License

MIT License

## 🆘 Support

- **Health Checks**: `/health`
- **Logs**: PM2 logs or Winston file logs
- **Documentation**: See documentation files
- **Validation**: `npm run validate` in backend

---

**Status**: ✅ Production Ready (78% Complete)  
**Last Updated**: Current Session





