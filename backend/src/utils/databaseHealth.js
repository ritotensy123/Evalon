const mongoose = require('mongoose');
const { logger } = require('./logger');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Organization = require('../models/Organization');
const Subject = require('../models/Subject');
const Department = require('../models/Department');

/**
 * Comprehensive database health check
 * Validates database connection, data integrity, and relationships
 */
const performDatabaseHealthCheck = async () => {
  const healthReport = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    issues: [],
    warnings: [],
    stats: {}
  };

  try {
    // 1. Check database connection
    if (mongoose.connection.readyState !== 1) {
      healthReport.status = 'unhealthy';
      healthReport.issues.push('Database connection is not established');
      return healthReport;
    }

    const currentDb = mongoose.connection.db.databaseName;
    logger.info(`Database Health Check - Connected to: ${currentDb}`);

    // 2. Validate expected database name - ENFORCED: MUST be 'evalon'
    const REQUIRED_DB_NAME = 'evalon';
    if (currentDb !== REQUIRED_DB_NAME) {
      healthReport.status = 'unhealthy';
      healthReport.issues.push(`CRITICAL: Connected to wrong database: ${currentDb}. Expected: ${REQUIRED_DB_NAME}. Only 'evalon' database is allowed.`);
    }

    // 3. Check collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    const expectedCollections = [
      'users', 'teachers', 'students', 'organizations', 
      'subjects', 'departments', 'exams', 'questions', 
      'questionbanks', 'examsessions', 'examactivitylogs',
      'usermanagements', 'invitations'
    ];
    
    for (const expectedCollection of expectedCollections) {
      if (!collectionNames.includes(expectedCollection)) {
        healthReport.warnings.push(`Missing expected collection: ${expectedCollection}`);
      }
    }
    
    // 4. Validate indexes on critical collections
    await validateIndexes(healthReport, collections);

    // 5. Check data counts
    const Exam = require('../models/Exam');
    const ExamSession = require('../models/ExamSession');
    const Question = require('../models/Question');
    const QuestionBank = require('../models/QuestionBank');
    
    const userCount = await User.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();
    const orgCount = await Organization.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const deptCount = await Department.countDocuments();
    const examCount = await Exam.countDocuments();
    const examSessionCount = await ExamSession.countDocuments();
    const questionCount = await Question.countDocuments();
    const questionBankCount = await QuestionBank.countDocuments();

    healthReport.stats = {
      users: userCount,
      teachers: teacherCount,
      students: studentCount,
      organizations: orgCount,
      subjects: subjectCount,
      departments: deptCount,
      exams: examCount,
      examSessions: examSessionCount,
      questions: questionCount,
      questionBanks: questionBankCount
    };

    // 6. Check connection pool status
    await checkConnectionPool(healthReport);

    // 7. Check for data consistency issues
    await checkDataConsistency(healthReport);

    // 8. Check for orphaned records
    await checkOrphanedRecords(healthReport);

    logger.info('Database health check completed', { status: healthReport.status, stats: healthReport.stats });
    return healthReport;

  } catch (error) {
    healthReport.status = 'unhealthy';
    healthReport.issues.push(`Health check failed: ${error.message}`);
    logger.error('Database health check failed', { error: error.message, stack: error.stack });
    return healthReport;
  }
};

/**
 * Check data consistency between User and related models
 */
const checkDataConsistency = async (healthReport) => {
  try {
    // Check teachers without corresponding User records
    const teachers = await Teacher.find({});
    for (const teacher of teachers) {
      const user = await User.findOne({ 
        email: teacher.email, 
        userType: 'teacher',
        userId: teacher._id 
      });
      
      if (!user) {
        healthReport.warnings.push(`Teacher ${teacher.email} has no corresponding User record`);
      } else if (!user.organizationId && teacher.organization) {
        healthReport.warnings.push(`User ${user.email} missing organizationId (should be ${teacher.organization})`);
      }
    }

    // Check students without corresponding User records
    const students = await Student.find({});
    for (const student of students) {
      const user = await User.findOne({ 
        email: student.email, 
        userType: 'student',
        userId: student._id 
      });
      
      if (!user) {
        healthReport.warnings.push(`Student ${student.email} has no corresponding User record`);
      }
    }

    // Check subjects without valid organization or department
    const subjects = await Subject.find({});
    for (const subject of subjects) {
      if (!subject.organizationId) {
        healthReport.issues.push(`Subject ${subject.name} has no organizationId`);
      }
      if (!subject.departmentId) {
        healthReport.warnings.push(`Subject ${subject.name} has no departmentId`);
      }
    }

  } catch (error) {
    healthReport.warnings.push(`Data consistency check failed: ${error.message}`);
  }
};

/**
 * Validate indexes on critical collections
 */
const validateIndexes = async (healthReport, collections) => {
  try {
    const db = mongoose.connection.db;
    const criticalIndexes = {
      users: ['email', 'organizationId', 'userType'],
      teachers: ['email', 'organization'],
      students: ['email', 'studentId', 'organization'],
      organizations: ['email', 'orgCode'],
      exams: ['organizationId', 'createdBy', 'status'],
      questions: ['organizationId', 'subjectId', 'createdBy'],
      examsessions: ['examId', 'studentId', 'status'],
    };

    for (const [collectionName, expectedFields] of Object.entries(criticalIndexes)) {
      const collection = collections.find(c => c.name === collectionName);
      if (!collection) continue;

      try {
        const indexes = await db.collection(collectionName).indexes();
        const indexFields = indexes.map(idx => {
          const keys = Object.keys(idx.key || {});
          return keys.length === 1 ? keys[0] : keys.join('_');
        });

        for (const field of expectedFields) {
          if (!indexFields.some(idx => idx.includes(field))) {
            healthReport.warnings.push(`Missing index on ${collectionName}.${field}`);
          }
        }
      } catch (error) {
        healthReport.warnings.push(`Failed to check indexes for ${collectionName}: ${error.message}`);
      }
    }
  } catch (error) {
    healthReport.warnings.push(`Index validation failed: ${error.message}`);
  }
};

/**
 * Check connection pool status
 */
const checkConnectionPool = async (healthReport) => {
  try {
    const connection = mongoose.connection;
    const poolStats = {
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name,
    };

    // Get connection pool stats if available
    if (connection.db && connection.db.serverConfig) {
      const serverConfig = connection.db.serverConfig;
      poolStats.poolSize = serverConfig.poolSize || 'N/A';
      poolStats.maxPoolSize = serverConfig.options?.maxPoolSize || 'N/A';
    }

    healthReport.connectionPool = poolStats;

    // Check if connection is healthy
    if (connection.readyState !== 1) {
      healthReport.status = 'unhealthy';
      healthReport.issues.push(`Database connection state is ${connection.readyState} (expected 1)`);
    }
  } catch (error) {
    healthReport.warnings.push(`Connection pool check failed: ${error.message}`);
  }
};

/**
 * Check for orphaned records
 */
const checkOrphanedRecords = async (healthReport) => {
  try {
    // Check subjects with invalid organization references
    const subjects = await Subject.find({});
    const orgIds = await Organization.distinct('_id');
    
    for (const subject of subjects) {
      if (subject.organizationId && !orgIds.some(id => id.toString() === subject.organizationId.toString())) {
        healthReport.warnings.push(`Subject ${subject.name} references non-existent organization ${subject.organizationId}`);
      }
    }

    // Check teachers with invalid organization references
    const teachers = await Teacher.find({});
    for (const teacher of teachers) {
      if (teacher.organization && !orgIds.some(id => id.toString() === teacher.organization.toString())) {
        healthReport.warnings.push(`Teacher ${teacher.email} references non-existent organization ${teacher.organization}`);
      }
    }

  } catch (error) {
    healthReport.warnings.push(`Orphaned records check failed: ${error.message}`);
  }
};

/**
 * Auto-fix common data consistency issues
 */
const autoFixDataIssues = async () => {
  const fixes = [];
  
  try {
    // Fix teachers without organizationId in User model
    const teachers = await Teacher.find({});
    for (const teacher of teachers) {
      const user = await User.findOne({ 
        email: teacher.email, 
        userType: 'teacher',
        userId: teacher._id 
      });
      
      if (user && !user.organizationId && teacher.organization) {
        user.organizationId = teacher.organization;
        await user.save();
        fixes.push(`Fixed organizationId for user ${user.email}`);
      }
    }

    // Fix students without organizationId in User model
    const students = await Student.find({});
    for (const student of students) {
      const user = await User.findOne({ 
        email: student.email, 
        userType: 'student',
        userId: student._id 
      });
      
      if (user && !user.organizationId && student.organization) {
        user.organizationId = student.organization;
        await user.save();
        fixes.push(`Fixed organizationId for user ${user.email}`);
      }
    }

    logger.info('Auto-fixes applied', { fixes });
    return fixes;

  } catch (error) {
    logger.error('Auto-fix failed', { error: error.message, stack: error.stack });
    return [];
  }
};

module.exports = {
  performDatabaseHealthCheck,
  checkDataConsistency,
  checkOrphanedRecords,
  autoFixDataIssues,
  validateIndexes,
  checkConnectionPool
};

