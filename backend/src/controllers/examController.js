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
      examType,
      totalQuestions,
      marksPerQuestion,
      totalMarks,
      scheduledDate,
      startTime,
      duration,
      organizationId
    } = req.body;

    // Get the current user
    const userId = req.user.id;

    const exam = new Exam({
      title,
      subject,
      class: className,
      examType,
      totalQuestions,
      marksPerQuestion,
      totalMarks,
      scheduledDate,
      startTime,
      duration,
      organizationId: organizationId || req.user.organizationId,
      createdBy: userId,
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
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Exam.countDocuments(filter);

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
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('questions');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
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

// Update exam
const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const updateData = req.body;

    const exam = await Exam.findByIdAndUpdate(
      examId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile.firstName profile.lastName email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
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

// Update exam status
const updateExamStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.body;

    const validStatuses = ['scheduled', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: scheduled, active, paused, completed'
      });
    }

    const exam = await Exam.findByIdAndUpdate(
      examId,
      { status },
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
      message: 'Exam status updated successfully',
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

// Get exam results
const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    // This would typically fetch results from a results collection
    // For now, return basic exam info
    const exam = await Exam.findById(examId)
      .populate('createdBy', 'profile.firstName profile.lastName email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
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

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  updateExamStatus,
  assignQuestionBankToExam,
  getExamQuestions,
  removeQuestionBankFromExam,
  getExamStatistics,
  duplicateExam,
  scheduleExam,
  getExamResults
};