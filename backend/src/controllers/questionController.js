/**
 * QuestionController
 * HTTP request/response handling for question operations
 * All business logic is delegated to QuestionService
 */

const QuestionService = require('../services/QuestionService');
const QuestionRepository = require('../repositories/QuestionRepository');
const ExamRepository = require('../repositories/ExamRepository');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// Create a new question
const createQuestion = asyncWrapper(async (req, res) => {
  const {
    title,
    description,
    subject,
    category,
    questionType,
    questionText,
    options,
    correctAnswer,
    explanation,
    marks,
    timeLimit,
    difficulty,
    tags,
    keywords,
    allowPartialCredit,
    showHint,
    hint,
    attachments
  } = req.body;

  const organizationId = req.user.organizationId;
  const createdBy = req.user._id;

  // Validate required fields
  if (!title || !subject || !category || !questionType || !questionText || !marks) {
    throw AppError.badRequest('Missing required fields');
  }

  // Validate question type specific requirements
  if (questionType === 'multiple_choice' && (!options || options.length < 2)) {
    throw AppError.badRequest('Multiple choice questions must have at least 2 options');
  }

  if (questionType !== 'multiple_choice' && !correctAnswer) {
    throw AppError.badRequest('Correct answer is required for non-multiple choice questions');
  }

  const questionData = {
    title,
    description,
    subject,
    category,
    questionType,
    questionText,
    options: options || [],
    correctAnswer,
    explanation,
    marks,
    timeLimit: timeLimit || 60,
    difficulty: difficulty || 'medium',
    tags: tags || [],
    keywords: keywords || [],
    createdBy,
    allowPartialCredit: allowPartialCredit || false,
    showHint: showHint || false,
    hint,
    attachments: attachments || []
  };

  const question = await QuestionService.createQuestion(questionData, organizationId);

  // Populate the question with creator details
  await question.populate('createdBy', 'profile firstName lastName');

  return sendSuccess(res, question, 'Question created successfully', 201);
});

// Get all questions for an organization
const getQuestions = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    subject,
    category,
    questionType,
    difficulty,
    status,
    tags,
    searchText,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filters = {
    subject,
    category,
    questionType,
    difficulty,
    status,
    tags: tags ? tags.split(',') : undefined,
    searchText
  };

  const pagination = { page: parseInt(page), limit: parseInt(limit) };

  const result = await QuestionService.listQuestions(organizationId, filters, pagination);

  return sendSuccess(res, {
    questions: result.questions,
    pagination: result.pagination
  }, 'Questions retrieved successfully', 200);
});

// Get a specific question by ID
const getQuestionById = asyncWrapper(async (req, res) => {
  const { questionId } = req.params;
  const organizationId = req.user.organizationId;

  const question = await QuestionRepository.findOne(
    { _id: questionId, organizationId },
    {
      populate: ['createdBy', 'validatedBy']
    }
  );

  if (!question) {
    throw AppError.notFound('Question not found');
  }

  return sendSuccess(res, question, 'Question retrieved successfully', 200);
});

// Update a question
const updateQuestion = asyncWrapper(async (req, res) => {
  const { questionId } = req.params;
  const organizationId = req.user.organizationId;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.organizationId;
  delete updateData.createdBy;
  delete updateData.analytics;
  delete updateData.usageCount;

  const question = await QuestionRepository.findOne({ _id: questionId, organizationId });
  if (!question) {
    throw AppError.notFound('Question not found');
  }

  const updatedQuestion = await QuestionRepository.updateById(questionId, updateData);
  await updatedQuestion.populate('createdBy', 'profile firstName lastName');

  return sendSuccess(res, updatedQuestion, 'Question updated successfully', 200);
});

// Delete a question
const deleteQuestion = asyncWrapper(async (req, res) => {
  const { questionId } = req.params;
  const organizationId = req.user.organizationId;

  // Check if question is used in any exams
  const examsUsingQuestion = await ExamRepository.findAll({
    questions: questionId,
    organizationId
  });

  if (examsUsingQuestion.length > 0) {
    throw AppError.badRequest('Cannot delete question as it is being used in exams', {
      usedInExams: examsUsingQuestion.length,
      examTitles: examsUsingQuestion.map(exam => exam.title)
    });
  }

  const question = await QuestionRepository.findOne({ _id: questionId, organizationId });
  if (!question) {
    throw AppError.notFound('Question not found');
  }

  await QuestionRepository.deleteById(questionId);

  return sendSuccess(res, null, 'Question deleted successfully', 200);
});

// Duplicate a question
const duplicateQuestion = asyncWrapper(async (req, res) => {
  const { questionId } = req.params;
  const organizationId = req.user.organizationId;

  const originalQuestion = await QuestionRepository.findOne({ _id: questionId, organizationId });
  if (!originalQuestion) {
    throw AppError.notFound('Question not found');
  }

  const duplicatedQuestion = await originalQuestion.createVersion({
    title: `${originalQuestion.title} (Copy)`,
    status: 'draft',
    usageCount: 0,
    analytics: {
      totalAttempts: 0,
      correctAttempts: 0,
      averageScore: 0,
      difficultyRating: originalQuestion.analytics?.difficultyRating || 0
    }
  });

  await duplicatedQuestion.populate('createdBy', 'profile firstName lastName');

  return sendSuccess(res, duplicatedQuestion, 'Question duplicated successfully', 200);
});

// Validate a question
const validateQuestion = asyncWrapper(async (req, res) => {
  const { questionId } = req.params;
  const organizationId = req.user.organizationId;
  const validatorId = req.user._id;

  const question = await QuestionRepository.findOne({ _id: questionId, organizationId });
  if (!question) {
    throw AppError.notFound('Question not found');
  }

  await question.validateQuestion(validatorId);

  return sendSuccess(res, question, 'Question validated successfully', 200);
});

// Get question statistics
const getQuestionStatistics = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId;

  const statistics = await Question.getQuestionStatistics(organizationId);
  const questionCounts = await Question.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const subjectStats = await Question.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        averageSuccessRate: { $avg: '$successRate' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const difficultyStats = await Question.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$difficulty',
        count: { $sum: 1 },
        averageScore: { $avg: '$analytics.averageScore' }
      }
    }
  ]);

  return sendSuccess(res, {
    overview: statistics[0] || {
      totalQuestions: 0,
      activeQuestions: 0,
      draftQuestions: 0,
      averageDifficulty: 0,
      totalUsage: 0,
      averageSuccessRate: 0
    },
    statusBreakdown: questionCounts,
    subjectStats,
    difficultyStats
  }, 'Question statistics retrieved successfully', 200);
});

// Get questions by subject
const getQuestionsBySubject = asyncWrapper(async (req, res) => {
  const { subject } = req.params;
  const organizationId = req.user.organizationId;

  const questions = await Question.getQuestionsBySubject(organizationId, subject);

  return sendSuccess(res, questions, 'Questions by subject retrieved successfully', 200);
});

// Get popular questions
const getPopularQuestions = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { limit = 10 } = req.query;

  const questions = await Question.getPopularQuestions(organizationId, parseInt(limit));

  return sendSuccess(res, questions, 'Popular questions retrieved successfully', 200);
});

// Record question attempt (for analytics)
const recordQuestionAttempt = asyncWrapper(async (req, res) => {
  const { questionId } = req.params;
  const { isCorrect, timeSpent } = req.body;
  const organizationId = req.user.organizationId;

  const question = await QuestionRepository.findOne({ _id: questionId, organizationId });
  if (!question) {
    throw AppError.notFound('Question not found');
  }

  await question.recordAttempt(isCorrect, timeSpent);

  return sendSuccess(res, null, 'Question attempt recorded successfully', 200);
});

// Bulk import questions
const bulkImportQuestions = asyncWrapper(async (req, res) => {
  const { questions } = req.body;
  const organizationId = req.user.organizationId;
  const createdBy = req.user._id;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw AppError.badRequest('Questions array is required');
  }

  const importResults = [];
  const errors = [];

  for (let i = 0; i < questions.length; i++) {
    try {
      const questionData = {
        ...questions[i],
        organizationId,
        createdBy
      };

      const question = await QuestionRepository.create(questionData);
      importResults.push({ index: i, success: true, questionId: question._id });
    } catch (error) {
      errors.push({ index: i, error: error.message });
      importResults.push({ index: i, success: false, error: error.message });
    }
  }

  return sendSuccess(res, {
    results: importResults,
    errors,
    successCount: importResults.filter(r => r.success).length,
    errorCount: errors.length
  }, `Imported ${importResults.filter(r => r.success).length} out of ${questions.length} questions`, 200);
});

// Export questions
const exportQuestions = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { format = 'json', subject, category, questionType } = req.query;

  const filters = { organizationId };
  if (subject) filters.subject = subject;
  if (category) filters.category = category;
  if (questionType) filters.questionType = questionType;

  const questions = await QuestionRepository.findAll(filters, {
    populate: 'createdBy',
    select: '-analytics -usageCount'
  });

  if (format === 'csv') {
    // Convert to CSV format
    const csvData = questions.map(q => ({
      title: q.title,
      subject: q.subject,
      category: q.category,
      questionType: q.questionType,
      difficulty: q.difficulty,
      marks: q.marks,
      tags: q.tags.join(',')
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');
    res.send(csvData);
  } else {
    return sendSuccess(res, questions, 'Questions exported successfully', 200);
  }
});

// Get available questions for an exam (filtered by subject, type, etc.)
const getAvailableQuestionsForExam = asyncWrapper(async (req, res) => {
  const {
    subject,
    questionType,
    difficulty,
    examId,
    limit = 50,
    page = 1
  } = req.query;

  const organizationId = req.user.organizationId;
  const filter = { organizationId };

  // Apply filters
  if (subject) filter.subject = subject;
  if (questionType) filter.questionType = questionType;
  if (difficulty) filter.difficulty = difficulty;

  // If examId is provided, exclude questions already in that exam
  if (examId) {
    const exam = await ExamRepository.findById(examId);
    if (exam && exam.questions && exam.questions.length > 0) {
      const usedQuestionIds = exam.questions.map(q => q.questionId || q._id);
      filter._id = { $nin: usedQuestionIds };
    }
  }

  const questions = await QuestionRepository.findAll(filter, {
    populate: 'createdBy',
    sort: { createdAt: -1 },
    limit: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit)
  });

  const total = await QuestionRepository.count(filter);

  return sendSuccess(res, {
    questions,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalQuestions: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  }, 'Available questions retrieved successfully', 200);
});

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  validateQuestion,
  getQuestionStatistics,
  getQuestionsBySubject,
  getPopularQuestions,
  recordQuestionAttempt,
  bulkImportQuestions,
  exportQuestions,
  getAvailableQuestionsForExam
};
