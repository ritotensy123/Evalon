# Database Health & Monitoring Guide

This guide explains the comprehensive database health monitoring and validation system implemented to prevent data integrity issues.

## 🚨 Problem Prevention

The system now includes multiple layers of protection to prevent issues like:
- Connecting to wrong database
- Missing organizationId for users
- Data inconsistency between User and Teacher/Student models
- Orphaned records

## 🔧 Components

### 1. Database Health Check (`src/utils/databaseHealth.js`)
- **Comprehensive validation** of database connection and data integrity
- **Auto-fix capabilities** for common data consistency issues
- **Orphaned record detection** and warnings
- **Data relationship validation** between models

### 2. Enhanced Database Connection (`src/config/database.js`)
- **Automatic validation** on startup
- **Database name verification** to prevent wrong database connections
- **Health check integration** with auto-fix capabilities
- **Detailed logging** for debugging

### 3. Health Check API (`/api/health`)
- `GET /api/health/status` - Public health check
- `GET /api/health/database` - Database info (authenticated)
- `POST /api/health/fix-data` - Auto-fix data issues (admin only)

### 4. Startup Validation Script (`scripts/validate-startup.js`)
- **Pre-startup validation** to catch issues before server starts
- **Environment variable validation**
- **Database connection testing**
- **Model accessibility verification**

## 🚀 Usage

### Safe Startup Commands
```bash
# Validate system before starting
npm run validate

# Start with validation
npm run start:safe

# Development with validation
npm run dev:safe
```

### Manual Health Check
```bash
# Check system health
curl http://localhost:5001/api/health/status

# Get database info (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/health/database

# Auto-fix data issues (admin only)
curl -X POST -H "Authorization: Bearer <admin-token>" http://localhost:5001/api/health/fix-data
```

## 🔍 What Gets Checked

### Database Connection
- ✅ Correct database name (`evalon`)
- ✅ Connection stability
- ✅ Required collections exist

### Data Consistency
- ✅ User records have corresponding Teacher/Student records
- ✅ Teachers have valid organization references
- ✅ Subjects have valid organization and department references
- ✅ No orphaned records

### Auto-Fixes Applied
- 🔧 Fix missing organizationId in User records
- 🔧 Sync organizationId between User and Teacher/Student models
- 🔧 Validate and fix data relationships

## 📊 Health Report Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "healthy",
  "issues": [],
  "warnings": [
    "Subject Math 101 has no departmentId"
  ],
  "stats": {
    "users": 10,
    "teachers": 5,
    "students": 20,
    "organizations": 1,
    "subjects": 8,
    "departments": 3
  }
}
```

## 🚨 Error Handling

### Critical Issues (System Won't Start)
- Wrong database connection
- Missing required collections
- Database connection failure

### Warnings (Auto-Fixed)
- Missing organizationId in User records
- Data inconsistency between models
- Orphaned record references

## 🔄 Monitoring

### Automatic Monitoring
- Health check runs on every server startup
- Auto-fixes applied for common issues
- Detailed logging for debugging

### Manual Monitoring
- Use health check API endpoints
- Run validation script before deployments
- Monitor server logs for warnings

## 🛠️ Troubleshooting

### Common Issues

1. **"Connected to wrong database"**
   - Check `MONGODB_URI` and `MONGODB_DB_NAME` in `.env`
   - Verify database name in connection string

2. **"No organizationId found for user"**
   - Run auto-fix: `POST /api/health/fix-data`
   - Check User and Teacher/Student model relationships

3. **"No subjects found for teacher"**
   - Verify teacher has assigned departments
   - Check subjects exist in organization
   - Validate department assignments

### Debug Commands
```bash
# Check database connection
npm run validate

# View detailed logs
tail -f server.log

# Test specific API
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/subjects
```

## 📝 Best Practices

1. **Always use safe startup commands** in production
2. **Run validation before deployments**
3. **Monitor health check endpoints** regularly
4. **Review warnings** in server logs
5. **Use auto-fix endpoints** for data consistency issues

## 🔮 Future Enhancements

- Real-time health monitoring dashboard
- Automated alerts for critical issues
- Performance metrics tracking
- Data backup validation
- Automated recovery procedures

