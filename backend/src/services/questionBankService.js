const QuestionRepository = require('../repositories/QuestionRepository');
const QuestionBankRepository = require('../repositories/QuestionBankRepository');
const ExamRepository = require('../repositories/ExamRepository');
const { logger } = require('../utils/logger');

class QuestionBankService {
  /**
   * Sync questions from question bank to exam
   * @param {string} examId - Exam ID
   * @param {string} questionBankId - Question Bank ID
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync result
   */
  async syncQuestionsFromBank(examId, questionBankId, options = {}) {
    try {
      const {
        totalQuestions = 10,
        questionTypes = ['multiple_choice', 'true_false', 'essay'],
        difficulties = ['easy', 'medium', 'hard'],
        shuffleQuestions = true,
        shuffleOptions = true
      } = options;

      logger.info('[QUESTION_BANK_SERVICE] Syncing questions from bank to exam', { questionBankId, examId, totalQuestions });

      // Get question bank
      const questionBank = await QuestionBankRepository.findById(questionBankId, {
        populate: 'questions'
      });
      
      if (!questionBank) {
        throw new Error('Question bank not found');
      }
      
      // Convert to plain object for manipulation
      const questionBankObj = questionBank.toObject ? questionBank.toObject() : questionBank;

      // Filter questions based on criteria
      let availableQuestions = (questionBankObj.questions || []).filter(q => 
        questionTypes.includes(q.questionType) &&
        difficulties.includes(q.difficulty) &&
        q.status === 'active'
      );

      logger.info('[QUESTION_BANK_SERVICE] Found available questions in bank', { count: availableQuestions.length, questionBankId });

      if (availableQuestions.length < totalQuestions) {
        logger.warn('[QUESTION_BANK_SERVICE] Not enough questions in bank', { available: availableQuestions.length, required: totalQuestions, questionBankId });
      }

      // Shuffle questions if requested
      if (shuffleQuestions) {
        availableQuestions = this.shuffleArray(availableQuestions);
      }

      // Select questions for exam
      const selectedQuestions = availableQuestions.slice(0, totalQuestions);

      // Shuffle options for each question if requested
      if (shuffleOptions) {
        selectedQuestions.forEach(question => {
          if (question.questionType === 'multiple_choice' && question.options) {
            question.options = this.shuffleArray(question.options);
          }
        });
      }

      // Update exam with selected questions
      const exam = await ExamRepository.findById(examId);
      if (!exam) {
        throw new Error('Exam not found');
      }

      // Update exam questions
      const updateData = {
        questions: selectedQuestions.map(q => q._id || q),
        totalQuestions: selectedQuestions.length,
        totalMarks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
        questionBankId: questionBankId,
        questionSelection: 'random'
      };

      await ExamRepository.updateById(examId, updateData);

      console.log(`✅ Synced ${selectedQuestions.length} questions to exam ${examId}`);

      return {
        success: true,
        examId,
        questionBankId,
        totalQuestions: selectedQuestions.length,
        totalMarks: exam.totalMarks,
        questions: selectedQuestions.map(q => ({
          id: q._id,
          title: q.title,
          questionType: q.questionType,
          marks: q.marks,
          difficulty: q.difficulty
        }))
      };

    } catch (error) {
      console.error('❌ Error syncing questions from bank:', error);
      throw error;
    }
  }

  /**
   * Generate shuffled questions for a specific student
   * @param {string} examId - Exam ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} Shuffled questions for student
   */
  async generateShuffledQuestionsForStudent(examId, studentId) {
    try {
      console.log(`🎲 Generating shuffled questions for student ${studentId} in exam ${examId}`);

      const exam = await ExamRepository.findById(examId, {
        populate: 'questions'
      });
      
      if (!exam) {
        throw new Error('Exam not found');
      }
      
      // Convert to plain object for manipulation
      const examObj = exam.toObject ? exam.toObject() : exam;

      if (!examObj.questions || examObj.questions.length === 0) {
        throw new Error('No questions found in exam');
      }

      // Create a deep copy of questions to avoid modifying original
      let studentQuestions = JSON.parse(JSON.stringify(examObj.questions));

      // Shuffle questions using student ID as seed for consistency
      studentQuestions = this.shuffleArrayWithSeed(studentQuestions, studentId);

      // Respect exam's totalQuestions setting
      if (examObj.totalQuestions && studentQuestions.length > examObj.totalQuestions) {
        console.log(`📝 Limiting questions to exam's totalQuestions: ${examObj.totalQuestions} (available: ${studentQuestions.length})`);
        studentQuestions = studentQuestions.slice(0, examObj.totalQuestions);
      }

      // Shuffle options for each multiple choice question
      studentQuestions.forEach(question => {
        if (question.questionType === 'multiple_choice' && question.options) {
          question.options = this.shuffleArrayWithSeed(question.options, studentId + question._id);
        }
      });

      // Add question numbers
      studentQuestions = studentQuestions.map((question, index) => ({
        ...question,
        questionNumber: index + 1,
        studentQuestionId: `${studentId}_${examId}_${question._id}_${Date.now()}`
      }));

      console.log(`✅ Generated ${studentQuestions.length} shuffled questions for student ${studentId}`);

      return studentQuestions;

    } catch (error) {
      console.error('❌ Error generating shuffled questions:', error);
      throw error;
    }
  }

  /**
   * Update question bank and sync to active exams
   * @param {string} questionBankId - Question Bank ID
   * @returns {Promise<Object>} Update result
   */
  async updateQuestionBankAndSync(questionBankId) {
    try {
      console.log(`🔄 Updating question bank ${questionBankId} and syncing to active exams`);

      // Find all active exams using this question bank
      const activeExams = await ExamRepository.findAll({
        questionBankId: questionBankId,
        status: { $in: ['scheduled', 'active'] }
      });

      console.log(`📝 Found ${activeExams.length} active exams using this question bank`);

      const updateResults = [];

      for (const exam of activeExams) {
        try {
          // Re-sync questions for this exam
          const syncResult = await this.syncQuestionsFromBank(exam._id, questionBankId, {
            totalQuestions: exam.totalQuestions,
            shuffleQuestions: exam.questionSelection === 'random'
          });

          updateResults.push({
            examId: exam._id,
            examTitle: exam.title,
            success: true,
            ...syncResult
          });

        } catch (error) {
          console.error(`❌ Error syncing exam ${exam._id}:`, error);
          updateResults.push({
            examId: exam._id,
            examTitle: exam.title,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        questionBankId,
        updatedExams: updateResults.length,
        results: updateResults
      };

    } catch (error) {
      console.error('❌ Error updating question bank:', error);
      throw error;
    }
  }

  /**
   * Get question bank statistics
   * @param {string} questionBankId - Question Bank ID
   * @returns {Promise<Object>} Statistics
   */
  async getQuestionBankStats(questionBankId) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId, {
        populate: 'questions'
      });
      
      if (!questionBank) {
        throw new Error('Question bank not found');
      }
      
      // Convert to plain object for manipulation
      const questionBankObj = questionBank.toObject ? questionBank.toObject() : questionBank;

      const questions = questionBankObj.questions || [];
      
      const stats = {
        totalQuestions: questions.length,
        questionsByType: {},
        questionsByDifficulty: {},
        totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
        averageMarks: 0,
        averageDifficulty: 0
      };

      // Calculate statistics
      questions.forEach(question => {
        // By type
        if (!stats.questionsByType[question.questionType]) {
          stats.questionsByType[question.questionType] = 0;
        }
        stats.questionsByType[question.questionType]++;

        // By difficulty
        if (!stats.questionsByDifficulty[question.difficulty]) {
          stats.questionsByDifficulty[question.difficulty] = 0;
        }
        stats.questionsByDifficulty[question.difficulty]++;
      });

      stats.averageMarks = questions.length > 0 ? stats.totalMarks / questions.length : 0;
      
      // Calculate average difficulty (1=easy, 2=medium, 3=hard)
      const difficultyValues = questions.map(q => {
        switch (q.difficulty) {
          case 'easy': return 1;
          case 'medium': return 2;
          case 'hard': return 3;
          default: return 2;
        }
      });
      stats.averageDifficulty = difficultyValues.length > 0 
        ? difficultyValues.reduce((sum, val) => sum + val, 0) / difficultyValues.length 
        : 0;

      return stats;

    } catch (error) {
      console.error('❌ Error getting question bank stats:', error);
      throw error;
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Shuffle array with seed for consistent shuffling
   * @param {Array} array - Array to shuffle
   * @param {string} seed - Seed for consistent shuffling
   * @returns {Array} Shuffled array
   */
  shuffleArrayWithSeed(array, seed) {
    const shuffled = [...array];
    let hash = this.simpleHash(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = this.simpleHash(hash.toString());
      const j = Math.abs(hash) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Simple hash function for seed-based shuffling
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Validate question bank for exam requirements
   * @param {string} questionBankId - Question Bank ID
   * @param {Object} requirements - Exam requirements
   * @returns {Promise<Object>} Validation result
   */
  async validateQuestionBank(questionBankId, requirements = {}) {
    try {
      const {
        totalQuestions = 10,
        questionTypes = ['multiple_choice'],
        difficulties = ['easy', 'medium', 'hard'],
        minMarks = 0,
        maxMarks = 100
      } = requirements;

      const questionBank = await QuestionBankRepository.findById(questionBankId, {
        populate: 'questions'
      });

      if (!questionBank) {
        return {
          valid: false,
          error: 'Question bank not found'
        };
      }
      
      // Convert to plain object for manipulation
      const questionBankObj = questionBank.toObject ? questionBank.toObject() : questionBank;

      const questions = (questionBankObj.questions || []).filter(q => 
        questionTypes.includes(q.questionType) &&
        difficulties.includes(q.difficulty) &&
        q.status === 'active' &&
        q.marks >= minMarks &&
        q.marks <= maxMarks
      );

      const validation = {
        valid: questions.length >= totalQuestions,
        totalAvailable: questions.length,
        required: totalQuestions,
        questionsByType: {},
        questionsByDifficulty: {},
        totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
        recommendations: []
      };

      // Analyze question distribution
      questions.forEach(question => {
        if (!validation.questionsByType[question.questionType]) {
          validation.questionsByType[question.questionType] = 0;
        }
        validation.questionsByType[question.questionType]++;

        if (!validation.questionsByDifficulty[question.difficulty]) {
          validation.questionsByDifficulty[question.difficulty] = 0;
        }
        validation.questionsByDifficulty[question.difficulty]++;
      });

      // Add recommendations
      if (questions.length < totalQuestions) {
        validation.recommendations.push(`Add ${totalQuestions - questions.length} more questions to meet requirements`);
      }

      if (validation.questionsByType.multiple_choice < totalQuestions * 0.5) {
        validation.recommendations.push('Consider adding more multiple choice questions');
      }

      return validation;

    } catch (error) {
      console.error('❌ Error validating question bank:', error);
      throw error;
    }
  }

  /**
   * Create a new question bank
   * @param {Object} questionBankData - Question bank data
   * @param {string} userId - Creator user ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Created question bank
   */
  async createQuestionBank(questionBankData, userId, organizationId) {
    try {
      if (!questionBankData.name || !questionBankData.subject || !questionBankData.class) {
        throw new Error('Question bank name, subject, and class are required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const data = {
        ...questionBankData,
        organizationId,
        createdBy: userId,
        status: questionBankData.status || 'draft',
        questions: [],
        totalQuestions: 0,
        questionsByType: {},
        questionsByDifficulty: {},
        totalMarks: 0
      };

      return await QuestionBankRepository.create(data);
    } catch (error) {
      console.error('❌ Error creating question bank:', error);
      throw error;
    }
  }

  /**
   * Get question bank by ID
   * @param {string} questionBankId - Question bank ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} Question bank
   */
  async getQuestionBankById(questionBankId, organizationId = null) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId, {
        populate: [
          { path: 'createdBy', select: 'profile.firstName profile.lastName email' },
          {
            path: 'questions',
            populate: {
              path: 'createdBy',
              select: 'profile.firstName profile.lastName email'
            }
          }
        ]
      });

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && questionBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      return questionBank;
    } catch (error) {
      console.error('❌ Error getting question bank:', error);
      throw error;
    }
  }

  /**
   * List question banks by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} { questionBanks, total, pagination }
   */
  async listQuestionBanks(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
    try {
      const filter = { organizationId };

      if (filters.subject) filter.subject = filters.subject;
      if (filters.class) filter.class = filters.class;
      if (filters.status) filter.status = filters.status;
      if (filters.search) {
        filter.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 10;
      const skip = (page - 1) * limit;

      const questionBanks = await QuestionBankRepository.findAll(filter, {
        populate: { path: 'createdBy', select: 'profile.firstName profile.lastName email' },
        sort: { createdAt: -1 },
        limit,
        skip
      });

      const total = await QuestionBankRepository.count(filter);

      return {
        questionBanks,
        total,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestionBanks: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ Error listing question banks:', error);
      throw error;
    }
  }

  /**
   * Update question bank
   * @param {string} questionBankId - Question bank ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} Updated question bank
   */
  async updateQuestionBank(questionBankId, updateData, organizationId = null) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId);

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && questionBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      // Prevent organizationId changes
      if (updateData.organizationId) {
        delete updateData.organizationId;
      }

      return await QuestionBankRepository.updateById(questionBankId, updateData);
    } catch (error) {
      console.error('❌ Error updating question bank:', error);
      throw error;
    }
  }

  /**
   * Delete question bank
   * @param {string} questionBankId - Question bank ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteQuestionBank(questionBankId, organizationId = null) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId);

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && questionBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      // Check if question bank is used in any exams
      const examsUsingBank = await ExamRepository.findAll({ questionBankId });
      if (examsUsingBank.length > 0) {
        throw new Error('Cannot delete question bank as it is being used in exams');
      }

      // Delete all questions in this bank
      await QuestionRepository.deleteMany({ questionBankId });

      await QuestionBankRepository.deleteById(questionBankId);

      return {
        success: true,
        message: 'Question bank deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting question bank:', error);
      throw error;
    }
  }

  /**
   * Add questions to question bank
   * @param {string} questionBankId - Question bank ID
   * @param {Array} questionsData - Array of question data
   * @param {string} userId - Creator user ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} Created questions
   */
  async addQuestionsToBank(questionBankId, questionsData, userId, organizationId = null) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId);

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && questionBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      const createdQuestions = [];
      const questionIds = [];

      for (const questionData of questionsData) {
        const question = await QuestionRepository.create({
          ...questionData,
          questionBankId,
          organizationId: questionBank.organizationId,
          createdBy: userId
        });
        createdQuestions.push(question);
        questionIds.push(question._id);
      }

      // Update question bank with new questions
      await QuestionBankRepository.updateById(questionBankId, {
        $push: { questions: { $each: questionIds } }
      });

      // Update statistics
      await this.updateQuestionBankStatistics(questionBankId);

      return { questions: createdQuestions };
    } catch (error) {
      console.error('❌ Error adding questions to bank:', error);
      throw error;
    }
  }

  /**
   * Get questions in a question bank
   * @param {string} questionBankId - Question bank ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Array>} Questions
   */
  async getQuestionsInBank(questionBankId, organizationId = null) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId);

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && questionBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      return await QuestionRepository.findAll(
        { questionBankId },
        {
          populate: { path: 'createdBy', select: 'profile.firstName profile.lastName email' },
          sort: { createdAt: 1 }
        }
      );
    } catch (error) {
      console.error('❌ Error getting questions in bank:', error);
      throw error;
    }
  }

  /**
   * Remove question from question bank
   * @param {string} questionBankId - Question bank ID
   * @param {string} questionId - Question ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} Deletion result
   */
  async removeQuestionFromBank(questionBankId, questionId, organizationId = null) {
    try {
      const questionBank = await QuestionBankRepository.findById(questionBankId);

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && questionBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      const question = await QuestionRepository.findOne({
        _id: questionId,
        questionBankId
      });

      if (!question) {
        throw new Error('Question not found in this question bank');
      }

      await QuestionRepository.deleteById(questionId);

      await QuestionBankRepository.updateById(questionBankId, {
        $pull: { questions: questionId }
      });

      await this.updateQuestionBankStatistics(questionBankId);

      return {
        success: true,
        message: 'Question removed from question bank successfully'
      };
    } catch (error) {
      console.error('❌ Error removing question from bank:', error);
      throw error;
    }
  }

  /**
   * Update question bank statistics
   * @param {string} questionBankId - Question bank ID
   * @returns {Promise<Object>} Updated statistics
   */
  async updateQuestionBankStatistics(questionBankId) {
    try {
      const questions = await QuestionRepository.findAll({ questionBankId });

      const stats = {
        totalQuestions: questions.length,
        questionsByType: {},
        questionsByDifficulty: {},
        totalMarks: 0
      };

      // Initialize counters
      ['multiple_choice', 'subjective', 'true_false', 'numeric'].forEach(type => {
        stats.questionsByType[type] = 0;
      });
      ['easy', 'medium', 'hard'].forEach(difficulty => {
        stats.questionsByDifficulty[difficulty] = 0;
      });

      // Calculate statistics
      questions.forEach(question => {
        stats.questionsByType[question.questionType] =
          (stats.questionsByType[question.questionType] || 0) + 1;
        stats.questionsByDifficulty[question.difficulty] =
          (stats.questionsByDifficulty[question.difficulty] || 0) + 1;
        stats.totalMarks += question.marks || 0;
      });

      await QuestionBankRepository.updateById(questionBankId, stats);

      return stats;
    } catch (error) {
      console.error('❌ Error updating question bank statistics:', error);
      throw error;
    }
  }

  /**
   * Duplicate question bank
   * @param {string} questionBankId - Question bank ID
   * @param {string} userId - Creator user ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} Duplicated question bank
   */
  async duplicateQuestionBank(questionBankId, userId, organizationId = null) {
    try {
      const originalBank = await QuestionBankRepository.findById(questionBankId, {
        populate: 'questions'
      });

      if (!originalBank) {
        throw new Error('Question bank not found');
      }

      if (organizationId && originalBank.organizationId?.toString() !== organizationId.toString()) {
        throw new Error('Access denied: Question bank does not belong to this organization');
      }

      const originalBankObj = originalBank.toObject ? originalBank.toObject() : originalBank;

      // Create duplicate question bank
      const duplicateBank = await QuestionBankRepository.create({
        ...originalBankObj,
        _id: undefined,
        name: `${originalBankObj.name} (Copy)`,
        questions: [],
        totalQuestions: 0,
        questionsByType: {},
        questionsByDifficulty: {},
        totalMarks: 0,
        usageCount: 0,
        lastUsed: null,
        createdBy: userId
      });

      // Duplicate questions
      const originalQuestions = await QuestionRepository.findAll({ questionBankId });
      const questionIds = [];

      for (const question of originalQuestions) {
        const questionObj = question.toObject ? question.toObject() : question;
        const duplicateQuestion = await QuestionRepository.create({
          ...questionObj,
          _id: undefined,
          questionBankId: duplicateBank._id,
          createdBy: userId
        });
        questionIds.push(duplicateQuestion._id);
      }

      // Update duplicate bank with questions
      await QuestionBankRepository.updateById(duplicateBank._id, {
        questions: questionIds
      });

      // Update statistics
      await this.updateQuestionBankStatistics(duplicateBank._id);

      return duplicateBank;
    } catch (error) {
      console.error('❌ Error duplicating question bank:', error);
      throw error;
    }
  }
}

module.exports = new QuestionBankService();
