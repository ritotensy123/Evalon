const Exam = require('../models/Exam');
const QuestionBank = require('../models/QuestionBank');
const User = require('../models/User');

// Create a new exam
const createExam = async (req, res) => {
  try {
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

    console.log('Creating exam with data:', { title, subject, class: className, organizationId });

    // Get the current user and validate organizationId
    const userId = req.user.id;
    const orgId = organizationId || req.user.organizationId;
    
    console.log('User ID:', userId, 'Organization ID:', orgId, 'req.user:', req.user);
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const exam = new Exam({
      title,
      subject,
      class: className,
      department,
      examType,
      totalQuestions,
      totalMarks: totalMarks || (totalQuestions * (marksPerQuestion || 1)),
      scheduledDate,
      startTime,
      duration,
      organizationId: orgId,
      createdBy: userId,
      assignedTeachers: assignedTeachers || [],
      status: 'scheduled',
      questionsAdded: 0
    });

    await exam.save();

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam',
      error: error.message
    });
  }
};

// Get all exams
const getExams = async (req, res) => {
  try {
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

    const exams = await Exam.find(filter)
      .populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel')
      .populate('questionBankId', 'name description subject class totalQuestions totalMarks status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate department information for teachers
    for (let exam of exams) {
      if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
        try {
          const Teacher = require('../models/Teacher');
          const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
          console.log('🔍 Teacher found:', {
            teacherId: exam.createdBy.userId,
            teacher: teacher ? {
              id: teacher._id,
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              departments: teacher.departments
            } : null
          });
          if (teacher && teacher.departments && teacher.departments.length > 0) {
            exam.createdBy.teacherDepartments = teacher.departments;
            console.log('✅ Teacher departments populated:', teacher.departments);
          } else {
            console.log('⚠️ Teacher has no departments assigned');
          }
        } catch (error) {
          console.error('Error populating teacher departments:', error);
        }
      }
    }

    const total = await Exam.countDocuments(filter);

    // Debug logging for department information
    console.log('🔍 Exam data with populated creator info:');
    exams.forEach((exam, index) => {
      console.log(`Exam ${index + 1}:`, {
        title: exam.title,
        department: exam.department,
        createdBy: {
          name: exam.createdBy?.profile?.firstName + ' ' + exam.createdBy?.profile?.lastName,
          email: exam.createdBy?.email,
          userType: exam.createdBy?.userType,
          userModel: exam.createdBy?.userModel,
          userId: exam.createdBy?.userId,
          teacherDepartments: exam.createdBy?.teacherDepartments
        }
      });
    });

    // Additional debug for API response
    console.log('📤 API Response data structure:');
    console.log('Exams count:', exams.length);
    if (exams.length > 0) {
      console.log('First exam createdBy structure:', JSON.stringify(exams[0].createdBy, null, 2));
    }

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalExams: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams',
      error: error.message
    });
  }
};

// Get exam by ID
const getExamById = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId)
      .populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel')
      .populate('questions');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Manually populate department information for teachers
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const Teacher = require('../../models/Teacher');
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        console.error('Error populating teacher departments:', error);
      }
    }

    res.json({
      success: true,
      data: { exam }
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam',
      error: error.message
    });
  }
};

// Update exam status
const updateExamStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: draft, scheduled, active, paused, completed, cancelled, expired'
      });
    }

    const exam = await Exam.findByIdAndUpdate(
      examId,
      { status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel')
     .populate('questionBankId', 'name description subject class totalQuestions totalMarks status');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Manually populate department information for teachers
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const Teacher = require('../../models/Teacher');
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        console.error('Error populating teacher departments:', error);
      }
    }

    res.json({
      success: true,
      message: `Exam status updated to ${status}`,
      data: { exam }
    });
  } catch (error) {
    console.error('Error updating exam status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exam status',
      error: error.message
    });
  }
};

// Update exam
const updateExam = async (req, res) => {
  try {
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

    console.log('Updating exam with data:', { examId, title, subject, class: className });

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

    const exam = await Exam.findByIdAndUpdate(
      examId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel')
     .populate('questionBankId', 'name description subject class totalQuestions totalMarks status');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Manually populate department information for teachers
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const Teacher = require('../../models/Teacher');
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        console.error('Error populating teacher departments:', error);
      }
    }

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exam',
      error: error.message
    });
  }
};

// Delete exam
const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findByIdAndDelete(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Note: Questions in the question bank are not deleted
    // They can be reused in other exams

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exam',
      error: error.message
    });
  }
};


// Assign question bank to exam
const assignQuestionBankToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionBankId } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Validate question bank exists and belongs to same organization
    const questionBank = await QuestionBank.findById(questionBankId);
    if (!questionBank || questionBank.organizationId.toString() !== exam.organizationId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Question bank not found or access denied'
      });
    }

    // Update exam with question bank reference
    exam.questionBankId = questionBankId;
    exam.questionsAdded = questionBank.totalQuestions;
    await exam.save();

    res.json({
      success: true,
      message: 'Question bank assigned to exam successfully',
      data: { 
        exam,
        questionBank
      }
    });
  } catch (error) {
    console.error('Error assigning question bank to exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign question bank to exam',
      error: error.message
    });
  }
};

// Get exam questions (populated from question bank)
const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate({
      path: 'questionBankId',
      populate: {
        path: 'questions',
        populate: {
          path: 'createdBy',
          select: 'profile.firstName profile.lastName email'
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (!exam.questionBankId) {
      return res.json({
        success: true,
        data: { questions: [] }
      });
    }

    // Return questions from the question bank
    const questions = exam.questionBankId.questions || [];

    res.json({
      success: true,
      data: { questions }
    });
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam questions',
      error: error.message
    });
  }
};

// Remove question bank from exam
const removeQuestionBankFromExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Remove question bank reference from exam
    exam.questionBankId = null;
    exam.questionsAdded = 0;
    await exam.save();

    res.json({
      success: true,
      message: 'Question bank removed from exam successfully'
    });
  } catch (error) {
    console.error('Error removing question bank from exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove question bank from exam',
      error: error.message
    });
  }
};

// Get exam statistics
const getExamStatistics = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate('questionBankId');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (!exam.questionBankId) {
      return res.json({
        success: true,
        data: { 
          statistics: {
            totalQuestions: 0,
            questionsByType: {},
            questionsByDifficulty: {},
            totalMarks: 0,
            averageMarks: 0,
            completionRate: 0
          }
        }
      });
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

    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Error fetching exam statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam statistics',
      error: error.message
    });
  }
};

// Duplicate exam
const duplicateExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const originalExam = await Exam.findById(examId);
    if (!originalExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Create duplicate exam with same question references
    const duplicateExam = new Exam({
      ...originalExam.toObject(),
      _id: undefined,
      title: `${originalExam.title} (Copy)`,
      status: 'scheduled',
      questions: originalExam.questions, // Copy question references
      questionsAdded: originalExam.questionsAdded,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await duplicateExam.save();

    res.json({
      success: true,
      message: 'Exam duplicated successfully',
      data: { exam: duplicateExam }
    });
  } catch (error) {
    console.error('Error duplicating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate exam',
      error: error.message
    });
  }
};

// Schedule exam
const scheduleExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { scheduledDate, startTime, duration } = req.body;

    const exam = await Exam.findByIdAndUpdate(
      examId,
      { scheduledDate, startTime, duration },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam scheduled successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Error scheduling exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule exam',
      error: error.message
    });
  }
};

// Get exams assigned to a specific teacher (or all exams for org admin)
const getExamsByTeacher = async (req, res) => {
  try {
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
      filter = {
        organizationId,
        $or: [
          { createdBy: userId },
          { assignedTeachers: userId }
        ]
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher or organization admin access only.'
      });
    }

    if (status) filter.status = status;
    if (subject) filter.subject = subject;

    const exams = await Exam.find(filter)
      .populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel')
      .populate('assignedTeachers', 'email userType')
      .populate('questionBankId', 'name totalQuestions')
      .sort({ scheduledDate: -1 });

    // Manually populate department information for teachers
    for (let exam of exams) {
      if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
        try {
          const Teacher = require('../models/Teacher');
          const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
          if (teacher && teacher.departments && teacher.departments.length > 0) {
            exam.createdBy.teacherDepartments = teacher.departments;
          }
        } catch (error) {
          console.error('Error populating teacher departments:', error);
        }
      }
    }

    // Debug logging for department information
    console.log('🔍 Teacher exam data with populated creator info:');
    exams.forEach((exam, index) => {
      console.log(`Exam ${index + 1}:`, {
        title: exam.title,
        department: exam.department,
        createdBy: {
          name: exam.createdBy?.profile?.firstName + ' ' + exam.createdBy?.profile?.lastName,
          email: exam.createdBy?.email,
          userType: exam.createdBy?.userType,
          userModel: exam.createdBy?.userModel,
          userId: exam.createdBy?.userId,
          teacherDepartments: exam.createdBy?.teacherDepartments
        }
      });
    });

    res.json({
      success: true,
      data: { exams }
    });
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher exams',
      error: error.message
    });
  }
};

// Get exams for a specific student
const getExamsByStudent = async (req, res) => {
  try {
    const studentId = req.user.id; // Current logged-in user ID
    const { status } = req.query;

    // First, get the user record to find the student data
    const user = await User.findById(studentId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If userType is student, populate the userId to get student data
    if (user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student access only.'
      });
    }

    // Populate the student data
    await user.populate('userId');
    
    if (!user.userId) {
      return res.status(404).json({
        success: false,
        message: 'Student data not found'
      });
    }

    const studentData = user.userId;
    const organizationId = req.user.organizationId;

    const filter = {
      organizationId,
      status: status || { $in: ['scheduled', 'active'] }
    };

    const exams = await Exam.find(filter)
      .populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel')
      .populate('questionBankId', 'name totalQuestions totalMarks status')
      .sort({ scheduledDate: 1 });

    // Manually populate department information for teachers
    for (let exam of exams) {
      if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
        try {
          const Teacher = require('../models/Teacher');
          const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
          if (teacher && teacher.departments && teacher.departments.length > 0) {
            exam.createdBy.teacherDepartments = teacher.departments;
          }
        } catch (error) {
          console.error('Error populating teacher departments:', error);
        }
      }
    }

    res.json({
      success: true,
      data: { exams }
    });
  } catch (error) {
    console.error('Error fetching student exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student exams',
      error: error.message
    });
  }
};

// Assign teachers to exam
const assignTeachersToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { teacherIds } = req.body; // Array of teacher user IDs

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Validate teachers exist and belong to same organization
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await User.find({
        _id: { $in: teacherIds },
        organizationId: exam.organizationId,
        userType: 'teacher'
      });

      if (teachers.length !== teacherIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more teachers not found or access denied'
        });
      }

      // Only assign unique teacher IDs
      const uniqueTeacherIds = [...new Set(teacherIds)];
      exam.assignedTeachers = uniqueTeacherIds;
      await exam.save();
    } else {
      // If no teacherIds provided, clear assignments
      exam.assignedTeachers = [];
      await exam.save();
    }

    // Populate with user details
    await exam.populate({
      path: 'assignedTeachers',
      select: 'email userType',
      populate: {
        path: 'userId',
        select: 'firstName lastName'
      }
    });

    res.json({
      success: true,
      message: 'Teachers assigned to exam successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Error assigning teachers to exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign teachers to exam',
      error: error.message
    });
  }
};

// Get exam results
const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    // This would typically fetch results from a results collection
    // For now, return basic exam info
    const exam = await Exam.findById(examId)
      .populate('createdBy', 'profile.firstName profile.lastName email userType userId userModel');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Manually populate department information for teachers
    if (exam.createdBy && exam.createdBy.userModel === 'Teacher') {
      try {
        const Teacher = require('../../models/Teacher');
        const teacher = await Teacher.findById(exam.createdBy.userId).populate('departments', 'name');
        if (teacher && teacher.departments && teacher.departments.length > 0) {
          exam.createdBy.teacherDepartments = teacher.departments;
        }
      } catch (error) {
        console.error('Error populating teacher departments:', error);
      }
    }

    res.json({
      success: true,
      data: { 
        exam,
        results: [] // Would be populated with actual results
      }
    });
  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam results',
      error: error.message
    });
  }
};

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
      console.log(`✅ Marked ${markedCount} exams as expired`);
    }
    
    return markedCount;
  } catch (error) {
    console.error('Error marking expired exams:', error);
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