const express = require('express');
const router = express.Router();
const questionBankService = require('../services/questionBankService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/question-bank/sync
// @desc    Sync questions from question bank to exam
// @access  Private (Teacher/Admin)
router.post('/sync', auth, [
  body('examId').isMongoId().withMessage('Valid exam ID is required'),
  body('questionBankId').isMongoId().withMessage('Valid question bank ID is required'),
  body('totalQuestions').optional().isInt({ min: 1, max: 100 }).withMessage('Total questions must be between 1 and 100'),
  body('questionTypes').optional().isArray().withMessage('Question types must be an array'),
  body('difficulties').optional().isArray().withMessage('Difficulties must be an array'),
  body('shuffleQuestions').optional().isBoolean().withMessage('Shuffle questions must be boolean'),
  body('shuffleOptions').optional().isBoolean().withMessage('Shuffle options must be boolean')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Check if user is teacher or admin
    if (!['teacher', 'admin', 'organization_admin'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and admins can sync questions.'
      });
    }

    const {
      examId,
      questionBankId,
      totalQuestions = 10,
      questionTypes = ['multiple_choice', 'true_false', 'essay'],
      difficulties = ['easy', 'medium', 'hard'],
      shuffleQuestions = true,
      shuffleOptions = true
    } = req.body;

    console.log(`🔄 Teacher ${req.user.email} syncing questions from bank ${questionBankId} to exam ${examId}`);

    const result = await questionBankService.syncQuestionsFromBank(examId, questionBankId, {
      totalQuestions,
      questionTypes,
      difficulties,
      shuffleQuestions,
      shuffleOptions
    });

    res.json({
      success: true,
      message: 'Questions synced successfully',
      data: result
    });

  } catch (error) {
    console.error('Error syncing questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync questions',
      error: error.message
    });
  }
});

// @route   GET /api/question-bank/generate/:examId/:studentId
// @desc    Generate shuffled questions for specific student
// @access  Private (Student/Teacher/Admin)
router.get('/generate/:examId/:studentId', auth, async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    // Check if user is the student or has permission
    if (req.user.userType === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only generate questions for yourself.'
      });
    }

    console.log(`🎲 Generating shuffled questions for student ${studentId} in exam ${examId}`);

    const questions = await questionBankService.generateShuffledQuestionsForStudent(examId, studentId);

    res.json({
      success: true,
      message: 'Shuffled questions generated successfully',
      data: {
        examId,
        studentId,
        questions,
        totalQuestions: questions.length
      }
    });

  } catch (error) {
    console.error('Error generating shuffled questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate shuffled questions',
      error: error.message
    });
  }
});

// @route   PUT /api/question-bank/update/:questionBankId
// @desc    Update question bank and sync to active exams
// @access  Private (Teacher/Admin)
router.put('/update/:questionBankId', auth, [
  body('questionBankId').isMongoId().withMessage('Valid question bank ID is required')
], async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (!['teacher', 'admin', 'organization_admin'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and admins can update question banks.'
      });
    }

    const { questionBankId } = req.params;

    console.log(`🔄 Teacher ${req.user.email} updating question bank ${questionBankId}`);

    const result = await questionBankService.updateQuestionBankAndSync(questionBankId);

    res.json({
      success: true,
      message: 'Question bank updated and synced successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question bank',
      error: error.message
    });
  }
});

// @route   GET /api/question-bank/stats/:questionBankId
// @desc    Get question bank statistics
// @access  Private (Teacher/Admin)
router.get('/stats/:questionBankId', auth, async (req, res) => {
  try {
    // Check if user is teacher or admin
    if (!['teacher', 'admin', 'organization_admin'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and admins can view question bank statistics.'
      });
    }

    const { questionBankId } = req.params;

    const stats = await questionBankService.getQuestionBankStats(questionBankId);

    res.json({
      success: true,
      message: 'Question bank statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error getting question bank stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question bank statistics',
      error: error.message
    });
  }
});

// @route   POST /api/question-bank/validate
// @desc    Validate question bank for exam requirements
// @access  Private (Teacher/Admin)
router.post('/validate', auth, [
  body('questionBankId').isMongoId().withMessage('Valid question bank ID is required'),
  body('totalQuestions').optional().isInt({ min: 1, max: 100 }).withMessage('Total questions must be between 1 and 100'),
  body('questionTypes').optional().isArray().withMessage('Question types must be an array'),
  body('difficulties').optional().isArray().withMessage('Difficulties must be an array'),
  body('minMarks').optional().isInt({ min: 0 }).withMessage('Min marks must be non-negative'),
  body('maxMarks').optional().isInt({ min: 1 }).withMessage('Max marks must be positive')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Check if user is teacher or admin
    if (!['teacher', 'admin', 'organization_admin'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and admins can validate question banks.'
      });
    }

    const {
      questionBankId,
      totalQuestions = 10,
      questionTypes = ['multiple_choice'],
      difficulties = ['easy', 'medium', 'hard'],
      minMarks = 0,
      maxMarks = 100
    } = req.body;

    const validation = await questionBankService.validateQuestionBank(questionBankId, {
      totalQuestions,
      questionTypes,
      difficulties,
      minMarks,
      maxMarks
    });

    res.json({
      success: true,
      message: 'Question bank validation completed',
      data: validation
    });

  } catch (error) {
    console.error('Error validating question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate question bank',
      error: error.message
    });
  }
});

// @route   GET /api/question-bank/exam/:examId/questions
// @desc    Get questions for specific exam (for students)
// @access  Private (Student)
router.get('/exam/:examId/questions', auth, async (req, res) => {
  try {
    // Check if user is student
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only students can access exam questions.'
      });
    }

    const { examId } = req.params;
    const studentId = req.user.id;

    console.log(`🎓 Student ${req.user.email} requesting questions for exam ${examId}`);

    const questions = await questionBankService.generateShuffledQuestionsForStudent(examId, studentId);

    res.json({
      success: true,
      message: 'Exam questions retrieved successfully',
      data: {
        examId,
        studentId,
        questions,
        totalQuestions: questions.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting exam questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exam questions',
      error: error.message
    });
  }
});

module.exports = router;
