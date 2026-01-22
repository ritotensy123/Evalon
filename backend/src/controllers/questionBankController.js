/**
 * QuestionBankController
 * HTTP request/response handling for question bank operations
 * All business logic is delegated to QuestionBankService
 */

const QuestionBankService = require('../services/questionBankService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// Create a new question bank
const createQuestionBank = asyncWrapper(async (req, res) => {
  const {
    name,
    description,
    subject,
    class: className,
    tags
  } = req.body;

  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const questionBankData = {
    name,
    description,
    subject,
    class: className,
    tags
  };

  const questionBank = await QuestionBankService.createQuestionBank(
    questionBankData,
    userId,
    organizationId
  );

  return sendSuccess(res, { questionBank }, 'Question bank created successfully', 201);
});

// Get all question banks
const getQuestionBanks = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subject,
    class: className,
    status,
    search
  } = req.query;

  // Get the actual organizationId - handle both ObjectId and full object
  let organizationId = req.user.organizationId;
  if (typeof organizationId === 'object' && organizationId._id) {
    organizationId = organizationId._id;
  }
  if (!organizationId) {
    organizationId = req.user.userId; // Fallback for org admin
  }

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const filters = {};
  if (subject) filters.subject = subject;
  if (className) filters.class = className;
  if (status) filters.status = status;
  if (search) filters.search = search;

  const result = await QuestionBankService.listQuestionBanks(
    organizationId,
    filters,
    { page: parseInt(page), limit: parseInt(limit) }
  );

  return sendSuccess(res, {
    questionBanks: result.questionBanks,
    pagination: result.pagination
  }, 'Question banks retrieved successfully', 200);
});

// Get question bank by ID
const getQuestionBankById = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  const questionBank = await QuestionBankService.getQuestionBankById(
    questionBankId,
    orgId
  );

  return sendSuccess(res, { questionBank }, 'Question bank retrieved successfully', 200);
});

// Update question bank
const updateQuestionBank = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const updateData = req.body;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  const questionBank = await QuestionBankService.updateQuestionBank(
    questionBankId,
    updateData,
    orgId
  );

  return sendSuccess(res, { questionBank }, 'Question bank updated successfully', 200);
});

// Delete question bank
const deleteQuestionBank = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  await QuestionBankService.deleteQuestionBank(questionBankId, orgId);

  return sendSuccess(res, null, 'Question bank deleted successfully', 200);
});

// Add questions to question bank
const addQuestionsToBank = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const { questions } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw AppError.badRequest('Questions array is required');
  }

  const result = await QuestionBankService.addQuestionsToBank(
    questionBankId,
    questions,
    userId,
    orgId
  );

  return sendSuccess(res, result, 'Questions added to question bank successfully', 200);
});

// Get questions in a question bank
const getQuestionsInBank = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  const questions = await QuestionBankService.getQuestionsInBank(questionBankId, orgId);

  return sendSuccess(res, { questions }, 'Questions retrieved successfully', 200);
});

// Remove question from question bank
const removeQuestionFromBank = asyncWrapper(async (req, res) => {
  const { questionBankId, questionId } = req.params;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  await QuestionBankService.removeQuestionFromBank(questionBankId, questionId, orgId);

  return sendSuccess(res, null, 'Question removed from question bank successfully', 200);
});

// Get question bank statistics
const getQuestionBankStatistics = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  const questionBank = await QuestionBankService.getQuestionBankById(questionBankId, orgId);

  // Return statistics from question bank
  const statistics = {
    totalQuestions: questionBank.totalQuestions || 0,
    questionsByType: questionBank.questionsByType || {},
    questionsByDifficulty: questionBank.questionsByDifficulty || {},
    totalMarks: questionBank.totalMarks || 0
  };

  return sendSuccess(res, { statistics }, 'Question bank statistics retrieved successfully', 200);
});

// Duplicate question bank
const duplicateQuestionBank = asyncWrapper(async (req, res) => {
  const { questionBankId } = req.params;
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  // Handle organizationId as object
  const orgId = typeof organizationId === 'object' && organizationId._id 
    ? organizationId._id 
    : organizationId;

  const duplicateBank = await QuestionBankService.duplicateQuestionBank(
    questionBankId,
    userId,
    orgId
  );

  return sendSuccess(res, { questionBank: duplicateBank }, 'Question bank duplicated successfully', 200);
});

module.exports = {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBankById,
  updateQuestionBank,
  deleteQuestionBank,
  addQuestionsToBank,
  getQuestionsInBank,
  removeQuestionFromBank,
  getQuestionBankStatistics,
  duplicateQuestionBank
};






