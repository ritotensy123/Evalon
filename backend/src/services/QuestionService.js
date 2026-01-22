/**
 * QuestionService
 * Service layer for question operations
 * Handles question CRUD operations and business logic
 */

const QuestionRepository = require('../repositories/QuestionRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const AppError = require('../utils/AppError');

class QuestionService {
  /**
   * Create a new question
   * @param {Object} questionData - Question data
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Created question
   * @throws {AppError} - If validation fails
   */
  async createQuestion(questionData, organizationId) {
    // Input validation
    if (!questionData.title || !questionData.questionText) {
      throw AppError.badRequest('Question title and text are required');
    }

    if (!questionData.questionBankId) {
      throw AppError.badRequest('Question bank ID is required');
    }

    if (!questionData.subject) {
      throw AppError.badRequest('Subject is required');
    }

    if (!questionData.questionType) {
      throw AppError.badRequest('Question type is required');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Set organization ID
    questionData.organizationId = organizationId;
    questionData.status = questionData.status || 'active';

    // Create question
    const question = await QuestionRepository.create(questionData);

    return question;
  }

  /**
   * List questions
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options (subject, category, questionType, status)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - { questions, total, pagination }
   * @throws {AppError} - If organization not found
   */
  async listQuestions(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Build filter
    const filter = { organizationId };
    
    if (filters.subject) {
      filter.subject = filters.subject;
    }
    
    if (filters.category) {
      filter.category = filters.category;
    }
    
    if (filters.questionType) {
      filter.questionType = filters.questionType;
    }
    
    if (filters.status) {
      filter.status = filters.status;
    }
    
    if (filters.questionBankId) {
      filter.questionBankId = filters.questionBankId;
    }

    // Calculate pagination
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    // Get questions
    const questions = await QuestionRepository.findAll(filter, {
      populate: ['questionBankId', 'organizationId'],
      sort: { createdAt: -1 },
      limit,
      skip
    });

    // Get total count
    const total = await QuestionRepository.count(filter);

    return {
      questions,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Update question
   * @param {string} questionId - Question ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Updated question
   * @throws {AppError} - If question not found or unauthorized
   */
  async updateQuestion(questionId, updateData, organizationId = null) {
    if (!questionId) {
      throw AppError.badRequest('Question ID is required');
    }

    // Get existing question
    const existingQuestion = await QuestionRepository.findById(questionId);
    if (!existingQuestion) {
      throw AppError.notFound('Question not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (existingQuestion.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Question does not belong to this organization');
      }
    }

    // Prevent organizationId changes
    if (updateData.organizationId) {
      delete updateData.organizationId;
    }

    // Update question
    const updatedQuestion = await QuestionRepository.updateById(questionId, updateData);

    if (!updatedQuestion) {
      throw AppError.notFound('Question not found after update');
    }

    return updatedQuestion;
  }

  /**
   * Delete question
   * @param {string} questionId - Question ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If question not found or unauthorized
   */
  async deleteQuestion(questionId, organizationId = null) {
    if (!questionId) {
      throw AppError.badRequest('Question ID is required');
    }

    // Get existing question
    const existingQuestion = await QuestionRepository.findById(questionId);
    if (!existingQuestion) {
      throw AppError.notFound('Question not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (existingQuestion.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Question does not belong to this organization');
      }
    }

    // Delete question
    const deletedQuestion = await QuestionRepository.deleteById(questionId);

    if (!deletedQuestion) {
      throw AppError.notFound('Question not found');
    }

    return {
      success: true,
      message: 'Question deleted successfully',
      questionId: deletedQuestion._id
    };
  }
}

module.exports = new QuestionService();
