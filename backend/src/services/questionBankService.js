const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');
const Exam = require('../models/Exam');

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

      console.log(`🔄 Syncing questions from bank ${questionBankId} to exam ${examId}`);

      // Get question bank
      const questionBank = await QuestionBank.findById(questionBankId)
        .populate('questions')
        .lean();

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      // Filter questions based on criteria
      let availableQuestions = questionBank.questions.filter(q => 
        questionTypes.includes(q.questionType) &&
        difficulties.includes(q.difficulty) &&
        q.status === 'active'
      );

      console.log(`📚 Found ${availableQuestions.length} available questions in bank`);

      if (availableQuestions.length < totalQuestions) {
        console.warn(`⚠️ Not enough questions in bank. Available: ${availableQuestions.length}, Required: ${totalQuestions}`);
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
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new Error('Exam not found');
      }

      // Update exam questions
      exam.questions = selectedQuestions.map(q => q._id);
      exam.totalQuestions = selectedQuestions.length;
      exam.totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      exam.questionBankId = questionBankId;
      exam.questionSelection = 'random';

      await exam.save();

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

      const exam = await Exam.findById(examId)
        .populate('questions')
        .lean();

      if (!exam) {
        throw new Error('Exam not found');
      }

      if (!exam.questions || exam.questions.length === 0) {
        throw new Error('No questions found in exam');
      }

      // Create a deep copy of questions to avoid modifying original
      let studentQuestions = JSON.parse(JSON.stringify(exam.questions));

      // Shuffle questions using student ID as seed for consistency
      studentQuestions = this.shuffleArrayWithSeed(studentQuestions, studentId);

      // Respect exam's totalQuestions setting
      if (exam.totalQuestions && studentQuestions.length > exam.totalQuestions) {
        console.log(`📝 Limiting questions to exam's totalQuestions: ${exam.totalQuestions} (available: ${studentQuestions.length})`);
        studentQuestions = studentQuestions.slice(0, exam.totalQuestions);
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
      const activeExams = await Exam.find({
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
      const questionBank = await QuestionBank.findById(questionBankId)
        .populate('questions')
        .lean();

      if (!questionBank) {
        throw new Error('Question bank not found');
      }

      const questions = questionBank.questions;
      
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

      const questionBank = await QuestionBank.findById(questionBankId)
        .populate('questions')
        .lean();

      if (!questionBank) {
        return {
          valid: false,
          error: 'Question bank not found'
        };
      }

      const questions = questionBank.questions.filter(q => 
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
}

module.exports = new QuestionBankService();
