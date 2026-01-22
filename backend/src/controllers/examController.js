/**
 * ExamController
 * HTTP request/response handling for exam operations
 * All business logic is delegated to ExamService
 */

const ExamService = require('../services/ExamService');
const ExamRepository = require('../repositories/ExamRepository');
const UserRepository = require('../repositories/UserRepository');
const QuestionBank = require('../models/QuestionBank');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

// Create a new exam
const createExam = asyncWrapper(async (req, res) => {
  const {
    title,
    subject,
    class: className,
    department,
    examType,
    totalQuestions,
    marksPerQuestion,
    totalMarks,
    scheduledDate,
    startTime,
    duration,
    organizationId,
    assignedTeachers
  } = req.body;

  const userId = req.user.id;
  const orgId = organizationId || req.user.organizationId;
  
  if (!orgId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const examData = {
    title,
    subject,
    class: className,
    department,
    examType,
    totalQuestions,
    marksPerQuestion,
    totalMarks: totalMarks || (totalQuestions * (marksPerQuestion || 1)),
    scheduledDate,
    startTime,
    duration,
    assignedTeachers: assignedTeachers || []
  };

  const exam = await ExamService.createExam(examData, userId, orgId);

  return sendSuccess(res, { exam }, 'Exam created successfully', 201);
});

// Get all exams
const getExams = asyncWrapper(async (req, res) => {
  // First, mark any expired exams
  await markExpiredExams();
  
  const {
    page = 1,
    limit = 10,
    status,
    subject,
    examType,
    organizationId
  } = req.query;

  const filter = {};
  
  if (organizationId) {
    filter.organizationId = organizationId;
  } else if (req.user.organizationId) {
    filter.organizationId = req.user.organizationId;
  }
  
  if (status) filter.status = status;
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;

  const exams = await ExamRepository.findAll(filter, {
    populate: ['createdBy', 'questionBankId'],
    sort: { createdAt: -1 },
    limit: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit)
  });

  // Manually populate department information for teachers
  for (let exam of exams) {
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        logger.error('Error populating teacher departments', { error: error.message, stack: error.stack });
      }
    }
  }

  const total = await ExamRepository.count(filter);

  return sendSuccess(res, {
    exams,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalExams: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  }, 'Exams retrieved successfully', 200);
});

// Get exam by ID
const getExamById = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  const exam = await ExamService.getExamById(examId, organizationId);

  return sendSuccess(res, { exam }, 'Exam retrieved successfully', 200);
});

// Update exam status
const updateExamStatus = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const { status } = req.body;

  if (!status || !['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired'].includes(status)) {
    throw AppError.badRequest('Invalid status. Must be one of: draft, scheduled, active, paused, completed, cancelled, expired');
  }

  const organizationId = req.user.organizationId;
  const exam = await ExamService.updateExam(examId, { status }, organizationId);

  return sendSuccess(res, { exam }, `Exam status updated to ${status}`, 200);
});

// Update exam
const updateExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const {
    title,
    subject,
    class: className,
    department,
    examType,
    totalQuestions,
    marksPerQuestion,
    totalMarks,
    scheduledDate,
    startTime,
    duration
  } = req.body;

  const updateData = {
    title,
    subject,
    class: className,
    department,
    examType,
    totalQuestions,
    totalMarks: totalMarks || (totalQuestions * (marksPerQuestion || 1)),
    scheduledDate,
    startTime,
    duration
  };

  const organizationId = req.user.organizationId;
  const exam = await ExamService.updateExam(examId, updateData, organizationId);

  return sendSuccess(res, { exam }, 'Exam updated successfully', 200);
});

// Delete exam
const deleteExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  await ExamService.deleteExam(examId, organizationId);

  return sendSuccess(res, null, 'Exam deleted successfully', 200);
});


// Assign question bank to exam
const assignQuestionBankToExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const { questionBankId } = req.body;
  const organizationId = req.user.organizationId;

  const exam = await ExamRepository.findById(examId);
  if (!exam) {
    throw AppError.notFound('Exam not found');
  }

  // Validate organization access
  if (exam.organizationId.toString() !== organizationId.toString()) {
    throw AppError.forbidden('Access denied: Exam does not belong to this organization');
  }

  // Validate question bank exists and belongs to same organization
  const questionBank = await QuestionBank.findById(questionBankId);
  if (!questionBank || questionBank.organizationId.toString() !== exam.organizationId.toString()) {
    throw AppError.badRequest('Question bank not found or access denied');
  }

  // Update exam with question bank reference
  const updatedExam = await ExamRepository.updateById(examId, {
    questionBankId: questionBankId,
    questionsAdded: questionBank.totalQuestions
  });

  return sendSuccess(res, { 
    exam: updatedExam,
    questionBank
  }, 'Question bank assigned to exam successfully', 200);
});

// Get exam questions (populated from question bank)
const getExamQuestions = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  const exam = await ExamService.getExamById(examId, organizationId);
  
  if (!exam.questionBankId) {
    return sendSuccess(res, { questions: [] }, 'No question bank assigned', 200);
  }

  // Populate question bank with questions
  await exam.populate({
    path: 'questionBankId',
    populate: {
      path: 'questions',
      populate: {
        path: 'createdBy',
        select: 'profile.firstName profile.lastName email'
      }
    }
  });

  const questions = exam.questionBankId?.questions || [];

  return sendSuccess(res, { questions }, 'Exam questions retrieved successfully', 200);
});

// Remove question bank from exam
const removeQuestionBankFromExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  const exam = await ExamRepository.findById(examId);
  if (!exam) {
    throw AppError.notFound('Exam not found');
  }

  // Validate organization access
  if (exam.organizationId.toString() !== organizationId.toString()) {
    throw AppError.forbidden('Access denied: Exam does not belong to this organization');
  }

  // Remove question bank reference from exam
  await ExamRepository.updateById(examId, {
    questionBankId: null,
    questionsAdded: 0
  });

  return sendSuccess(res, null, 'Question bank removed from exam successfully', 200);
});

// Get exam statistics
const getExamStatistics = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  const exam = await ExamRepository.findById(examId, {
    populate: 'questionBankId'
  });
  
  if (!exam) {
    throw AppError.notFound('Exam not found');
  }

  // Validate organization access
  if (exam.organizationId.toString() !== organizationId.toString()) {
    throw AppError.forbidden('Access denied: Exam does not belong to this organization');
  }

  if (!exam.questionBankId) {
    return sendSuccess(res, { 
      statistics: {
        totalQuestions: 0,
        questionsByType: {},
        questionsByDifficulty: {},
        totalMarks: 0,
        averageMarks: 0,
        completionRate: 0
      }
    }, 'No question bank assigned', 200);
  }

  // Use question bank statistics
  const questionBank = exam.questionBankId;
  const statistics = {
    totalQuestions: questionBank.totalQuestions,
    questionsByType: questionBank.questionsByType,
    questionsByDifficulty: questionBank.questionsByDifficulty,
    totalMarks: questionBank.totalMarks,
    averageMarks: questionBank.totalQuestions > 0 ? questionBank.totalMarks / questionBank.totalQuestions : 0,
    completionRate: (questionBank.totalQuestions / exam.totalQuestions) * 100
  };

  return sendSuccess(res, { statistics }, 'Exam statistics retrieved successfully', 200);
});

// Duplicate exam
const duplicateExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  const originalExam = await ExamRepository.findById(examId);
  if (!originalExam) {
    throw AppError.notFound('Exam not found');
  }

  // Validate organization access
  if (originalExam.organizationId.toString() !== organizationId.toString()) {
    throw AppError.forbidden('Access denied: Exam does not belong to this organization');
  }

  // Create duplicate exam with same question references
  const duplicateExamData = {
    ...originalExam.toObject(),
    _id: undefined,
    title: `${originalExam.title} (Copy)`,
    status: 'scheduled',
    questions: originalExam.questions, // Copy question references
    questionsAdded: originalExam.questionsAdded,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const duplicateExam = await ExamRepository.create(duplicateExamData);

  return sendSuccess(res, { exam: duplicateExam }, 'Exam duplicated successfully', 200);
});

// Schedule exam
const scheduleExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const { scheduledDate, startTime, duration } = req.body;
  const organizationId = req.user.organizationId;

  const exam = await ExamService.updateExam(examId, {
    scheduledDate,
    startTime,
    duration
  }, organizationId);

  return sendSuccess(res, { exam }, 'Exam scheduled successfully', 200);
});

// Get exams assigned to a specific teacher (or all exams for org admin)
const getExamsByTeacher = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  const organizationId = req.user.organizationId;
  const { status, subject } = req.query;

  let filter = {};

  // If user is organization admin, show all exams in their organization
  if (userType === 'organization_admin') {
    filter = { organizationId };
  } else if (userType === 'teacher') {
    // If user is teacher, show exams they created or are assigned to
    if (organizationId) {
      // Organization teacher: filter by organizationId
      filter = {
        organizationId,
        $or: [
          { createdBy: userId },
          { assignedTeachers: userId }
        ]
      };
    } else {
      // Standalone teacher: only their own exams, explicitly null organizationId
      filter = {
        organizationId: null,
        $or: [
          { createdBy: userId },
          { assignedTeachers: userId }
        ]
      };
    }
  } else {
    throw AppError.forbidden('Access denied. Teacher or organization admin access only.');
  }

  if (status) filter.status = status;
  if (subject) filter.subject = subject;

  const exams = await ExamRepository.findAll(filter, {
    populate: ['createdBy', 'assignedTeachers', 'questionBankId'],
    sort: { scheduledDate: -1 }
  });

  // Manually populate department information for teachers
  for (let exam of exams) {
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        logger.error('Error populating teacher departments', { error: error.message, stack: error.stack });
      }
    }
  }

  return sendSuccess(res, { exams }, 'Teacher exams retrieved successfully', 200);
});

// Get exams for a specific student
const getExamsByStudent = asyncWrapper(async (req, res) => {
  const studentId = req.user.id; // Current logged-in user ID
  const { status } = req.query;

  // First, get the user record to find the student data
  const user = await UserRepository.findById(studentId);
  
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // If userType is student, populate the userId to get student data
  if (user.userType !== 'student') {
    throw AppError.forbidden('Access denied. Student access only.');
  }

  // Populate the student data
  await user.populate('userId');
  
  if (!user.userId) {
    throw AppError.notFound('Student data not found');
  }

  const organizationId = req.user.organizationId;

  const filter = {
    organizationId,
    status: status || { $in: ['scheduled', 'active'] }
  };

  const exams = await ExamRepository.findAll(filter, {
    populate: ['createdBy', 'questionBankId'],
    sort: { scheduledDate: 1 }
  });

  // Manually populate department information for teachers
  for (let exam of exams) {
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        logger.error('Error populating teacher departments', { error: error.message, stack: error.stack });
      }
    }
  }

  return sendSuccess(res, { exams }, 'Student exams retrieved successfully', 200);
});

// Assign teachers to exam
const assignTeachersToExam = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const { teacherIds } = req.body; // Array of teacher user IDs
  const organizationId = req.user.organizationId;

  const exam = await ExamRepository.findById(examId);
  if (!exam) {
    throw AppError.notFound('Exam not found');
  }

  // Validate organization access
  if (exam.organizationId.toString() !== organizationId.toString()) {
    throw AppError.forbidden('Access denied: Exam does not belong to this organization');
  }

  // Validate teachers exist and belong to same organization
  if (teacherIds && teacherIds.length > 0) {
    const teachers = await UserRepository.findAll({
      _id: { $in: teacherIds },
      organizationId: exam.organizationId,
      userType: 'teacher'
    });

    if (teachers.length !== teacherIds.length) {
      throw AppError.badRequest('One or more teachers not found or access denied');
    }

    // Only assign unique teacher IDs
    const uniqueTeacherIds = [...new Set(teacherIds)];
    await ExamRepository.updateById(examId, { assignedTeachers: uniqueTeacherIds });
  } else {
    // If no teacherIds provided, clear assignments
    await ExamRepository.updateById(examId, { assignedTeachers: [] });
  }

  // Get updated exam with populated teachers
  const updatedExam = await ExamRepository.findById(examId, {
    populate: {
      path: 'assignedTeachers',
      select: 'email userType',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    }
  });

  return sendSuccess(res, { exam: updatedExam }, 'Teachers assigned to exam successfully', 200);
});

// Get exam results
const getExamResults = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const organizationId = req.user.organizationId;

  // This would typically fetch results from a results collection
  // For now, return basic exam info
  const exam = await ExamService.getExamById(examId, organizationId);

  // Manually populate department information for teachers
  if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
    try {
      const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
      if (teacher && teacher.departments && teacher.departments.length > 0) {
        exam.createdBy.teacherDepartments = teacher.departments;
      }
    } catch (error) {
      logger.error('Error populating teacher departments', { error: error.message, stack: error.stack });
    }
  }

  return sendSuccess(res, { 
    exam,
    results: [] // Would be populated with actual results
  }, 'Exam results retrieved successfully', 200);
});

// Mark expired exams automatically
const markExpiredExams = async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Find scheduled exams that have passed their time
    const expiredExams = await Exam.find({
      status: 'scheduled',
      scheduledDate: { $lte: today }
    });

    let markedCount = 0;
    
    for (const exam of expiredExams) {
      const scheduledDateTime = new Date(`${exam.scheduledDate}T${exam.startTime}`);
      
      // If exam time has passed, mark as expired
      if (now > scheduledDateTime) {
        await Exam.findByIdAndUpdate(exam._id, { status: 'expired' });
        markedCount++;
      }
    }
    
    if (markedCount > 0) {
      logger.info(`✅ Marked ${markedCount} exams as expired`, { markedCount });
    }
    
    return markedCount;
  } catch (error) {
    logger.error('Error marking expired exams', { error: error.message, stack: error.stack });
    return 0;
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  getExamsByTeacher,
  getExamsByStudent,
  updateExam,
  deleteExam,
  updateExamStatus,
  assignQuestionBankToExam,
  assignTeachersToExam,
  getExamQuestions,
  removeQuestionBankFromExam,
  getExamStatistics,
  duplicateExam,
  scheduleExam,
  getExamResults,
  markExpiredExams
};