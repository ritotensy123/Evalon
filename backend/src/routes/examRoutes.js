const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/examController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Exam CRUD routes
router.post('/', createExam);
router.get('/', getExams);
router.get('/:examId', getExamById);
router.put('/:examId', updateExam);
router.delete('/:examId', deleteExam);

// Exam status management
router.patch('/:examId/status', updateExamStatus);

// Question bank management for exams
router.post('/:examId/assign-question-bank', assignQuestionBankToExam);
router.get('/:examId/questions', getExamQuestions);
router.delete('/:examId/question-bank', removeQuestionBankFromExam);

// Exam operations
router.get('/:examId/statistics', getExamStatistics);
router.post('/:examId/duplicate', duplicateExam);
router.post('/:examId/schedule', scheduleExam);
router.get('/:examId/results', getExamResults);

module.exports = router;