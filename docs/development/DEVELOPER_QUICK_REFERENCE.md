# Evalon Developer Quick Reference

## 🚀 Quick Start

### Backend Development
```bash
cd backend
npm install
cp env.template .env
# Edit .env with your configuration
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

### Backend
```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # MongoDB connection
│   │   ├── server.js    # Server config (ports, CORS)
│   │   ├── ports.js     # Port definitions
│   │   └── upload.js    # File upload config
│   ├── constants/       # Application constants
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # JWT authentication
│   │   ├── validation.js # Input validation
│   │   ├── rateLimiter.js # Rate limiting
│   │   └── requestTimeout.js # Request timeouts
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   │   ├── logger.js    # Winston logger
│   │   ├── apiResponse.js # Standardized responses
│   │   └── databaseHealth.js # DB health checks
│   ├── server.js        # Main server
│   └── realtimeServer.js # WebSocket server
└── scripts/
    └── validate-startup.js # Startup validation
```

### Frontend
```
frontend/
├── src/
│   ├── components/      # React components
│   │   └── ErrorBoundary.js
│   ├── config/          # Configuration
│   │   └── apiConfig.js # API endpoints
│   ├── services/        # API services
│   │   └── api.js       # Axios instances
│   ├── utils/           # Utilities
│   │   ├── apiClient.js # API client utilities
│   │   └── axiosConfig.js # Axios configuration
│   └── App.js           # Main app component
```

---

## 🔧 Common Tasks

### Adding a New API Endpoint

1. **Create Controller** (`backend/src/controllers/`)
```javascript
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncWrapper = require('../middleware/asyncWrapper');
const { logger } = require('../utils/logger');

exports.getItems = asyncWrapper(async (req, res) => {
  // Your logic here
  return sendSuccess(res, data, 'Items retrieved successfully');
});
```

2. **Add Route** (`backend/src/routes/`)
```javascript
const { getItems } = require('../controllers/itemController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body } = require('express-validator');

router.get('/', authenticate, getItems);
```

3. **Register Route** (`backend/src/server.js`)
```javascript
const itemRoutes = require('./routes/itemRoutes');
app.use(`${API_PREFIX}/items`, itemRoutes);
```

### Adding Input Validation

```javascript
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    validateRequest
  ],
  handler
);
```

### Using Standardized Responses

```javascript
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// Success response
sendSuccess(res, data, 'Operation successful', 200);

// Error response
sendError(res, error, 'Operation failed', 500);

// Paginated response
sendPaginated(res, items, total, page, limit, 'Items retrieved');
```

### Logging

```javascript
const { logger } = require('../utils/logger');

logger.info('Info message', { context: 'additional data' });
logger.warn('Warning message', { context: 'data' });
logger.error('Error message', { error: err.message, stack: err.stack });
```

---

## 🔐 Authentication

### Protecting Routes
```javascript
const { authenticate } = require('../middleware/auth');

router.get('/protected', authenticate, handler);
```

### Accessing User Info
```javascript
// In controller
const userId = req.user.id;
const userType = req.user.userType;
const organizationId = req.user.organizationId;
```

---

## 🛡️ Security Features

### Rate Limiting
```javascript
const { strictRateLimiter, standardRateLimiter } = require('../middleware/rateLimiter');

// Strict (5 req/15min) - for auth endpoints
router.post('/login', strictRateLimiter, handler);

// Standard (100 req/15min) - for general endpoints
router.get('/items', standardRateLimiter, handler);
```

### Request Timeout
```javascript
const { standardTimeout, longTimeout } = require('../middleware/requestTimeout');

// Standard (30s)
router.get('/items', standardTimeout, handler);

// Long (60s) - for complex operations
router.post('/process', longTimeout, handler);
```

---

## 📊 Database

### Connection
```javascript
const connectDB = require('./config/database');
await connectDB();
```

### Health Check
```javascript
const { performDatabaseHealthCheck } = require('./utils/databaseHealth');
const health = await performDatabaseHealthCheck();
```

### Models
```javascript
const User = require('./models/User');
const user = await User.findById(id);
```

---

## 🌐 API Client (Frontend)

### Making API Calls
```javascript
import { organizationAPI } from './services/api';

try {
  const response = await organizationAPI.getById(id);
  // response.data contains the data
} catch (error) {
  // Error is already standardized
  console.error(error.message);
}
```

### Request Cancellation
```javascript
import { createRequestCanceller } from './utils/apiClient';

const { controller, cancel } = createRequestCanceller();

// Make request with signal
const response = await api.get('/endpoint', {
  signal: controller.signal
});

// Cancel if needed
cancel('User cancelled');
```

---

## 🔄 Error Handling

### Backend
```javascript
const asyncWrapper = require('../middleware/asyncWrapper');

exports.handler = asyncWrapper(async (req, res) => {
  // Errors are automatically caught and handled
  throw new Error('Something went wrong');
});
```

### Frontend
```javascript
// Error boundaries catch React errors
// API errors are standardized in apiClient.js
```

---

## 📝 Constants

### Using Constants
```javascript
const { HTTP_STATUS, USER_ROLES, TIME } = require('../constants');

res.status(HTTP_STATUS.OK);
if (user.role === USER_ROLES.TEACHER) { }
setTimeout(() => {}, TIME.SECOND * 5);
```

---

## 🚀 Deployment

### PM2
```bash
# Start
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Logs
pm2 logs
```

### Health Checks
```bash
curl http://localhost:5001/health
curl http://localhost:5001/health/detailed
```

---

## 🐛 Debugging

### Backend Logs
```bash
# PM2 logs
pm2 logs evalon-api

# Winston logs (if file transport enabled)
tail -f logs/combined.log
```

### Frontend
- Check browser console
- Network tab for API calls
- React DevTools for component state

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/config/server.js` | Server configuration |
| `backend/src/config/database.js` | Database connection |
| `backend/src/utils/logger.js` | Winston logger |
| `backend/src/utils/apiResponse.js` | Standardized responses |
| `backend/src/middleware/auth.js` | Authentication |
| `backend/src/constants/index.js` | Application constants |
| `frontend/src/config/apiConfig.js` | API endpoints |
| `frontend/src/utils/apiClient.js` | API client utilities |

---

## ⚠️ Important Notes

1. **No Hardcoded Values** - Use environment variables or constants
2. **Always Use Logger** - Never use `console.log` in production code
3. **Standardized Responses** - Use `sendSuccess`/`sendError` utilities
4. **Error Handling** - Wrap async handlers with `asyncWrapper`
5. **Validation** - Always validate input with express-validator
6. **Database Name** - MUST be 'evalon' (enforced)

---

**Last Updated**: Current session

