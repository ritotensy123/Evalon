const mongoose = require('mongoose');
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
    console.log(`🔍 Database Health Check - Connected to: ${currentDb}`);

    // 2. Validate expected database name
    if (currentDb !== 'evalon') {
      healthReport.warnings.push(`Connected to unexpected database: ${currentDb}. Expected: evalon`);
    }

    // 3. Check collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    const expectedCollections = ['users', 'teachers', 'students', 'organizations', 'subjects', 'departments'];
    
    for (const expectedCollection of expectedCollections) {
      if (!collectionNames.includes(expectedCollection)) {
        healthReport.warnings.push(`Missing expected collection: ${expectedCollection}`);
      }
    }

    // 4. Check data counts
    const userCount = await User.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();
    const orgCount = await Organization.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const deptCount = await Department.countDocuments();

    healthReport.stats = {
      users: userCount,
      teachers: teacherCount,
      students: studentCount,
      organizations: orgCount,
      subjects: subjectCount,
      departments: deptCount
    };

    // 5. Check for data consistency issues
    await checkDataConsistency(healthReport);

    // 6. Check for orphaned records
    await checkOrphanedRecords(healthReport);

    console.log('✅ Database health check completed:', healthReport);
    return healthReport;

  } catch (error) {
    healthReport.status = 'unhealthy';
    healthReport.issues.push(`Health check failed: ${error.message}`);
    console.error('❌ Database health check failed:', error);
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

    console.log('🔧 Auto-fixes applied:', fixes);
    return fixes;

  } catch (error) {
    console.error('❌ Auto-fix failed:', error);
    return [];
  }
};

module.exports = {
  performDatabaseHealthCheck,
  checkDataConsistency,
  checkOrphanedRecords,
  autoFixDataIssues
};

