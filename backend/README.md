# Evalon Backend API

A robust Node.js backend API for the Evalon educational platform, built with Express.js and MongoDB Atlas.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB Atlas** integration with Mongoose ODM
- **JWT Authentication** for secure user sessions
- **Rate Limiting** to prevent abuse
- **CORS** configuration for frontend integration
- **Security Middleware** with Helmet
- **Request Logging** with Morgan
- **Error Handling** with global error middleware
- **Environment Configuration** with dotenv
- **Compression** for better performance

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Custom middleware
│   ├── models/                  # Mongoose models
│   ├── routes/                  # API routes
│   ├── utils/                   # Utility functions
│   └── server.js                # Main server file
├── tests/                       # Test files
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=evalon

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📝 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🌐 API Endpoints

### Health Check
- `GET /health` - Server health status

### API Base
- `GET /api` - API status and information

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration
- **Input validation** with express-validator
- **JWT token** authentication
- **Password hashing** with bcryptjs

## 🗄️ Database

The application uses **MongoDB Atlas** as the primary database with the following configuration:

- **Connection String**: MongoDB Atlas cluster
- **Database Name**: evalon
- **ODM**: Mongoose for schema management
- **Connection Pooling**: Automatic connection management

## 🧪 Testing

The project includes Jest for testing:

```bash
npm test
```

## 📊 Monitoring

- **Morgan** for HTTP request logging
- **Error tracking** with global error handler
- **Health check** endpoint for monitoring

## 🚀 Deployment

The application is ready for deployment to various platforms:

- **Heroku**
- **Vercel**
- **Railway**
- **DigitalOcean**
- **AWS**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.




