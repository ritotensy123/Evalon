const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/questionController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Question CRUD operations
router.post('/', createQuestion);
router.get('/', getQuestions);
router.get('/statistics', getQuestionStatistics);
router.get('/popular', getPopularQuestions);
router.get('/export', exportQuestions);
router.get('/available-for-exam', getAvailableQuestionsForExam);
router.get('/subject/:subject', getQuestionsBySubject);
router.get('/:questionId', getQuestionById);
router.put('/:questionId', updateQuestion);
router.delete('/:questionId', deleteQuestion);

// Question management
router.post('/:questionId/duplicate', duplicateQuestion);
router.post('/:questionId/validate', validateQuestion);
router.post('/:questionId/attempt', recordQuestionAttempt);

// Bulk operations
router.post('/bulk-import', bulkImportQuestions);

module.exports = router;
