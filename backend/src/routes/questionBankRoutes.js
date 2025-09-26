const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/questionBankController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Question Bank CRUD routes
router.post('/', createQuestionBank);
router.get('/', getQuestionBanks);
router.get('/:questionBankId', getQuestionBankById);
router.put('/:questionBankId', updateQuestionBank);
router.delete('/:questionBankId', deleteQuestionBank);

// Question management in question bank
router.post('/:questionBankId/questions', addQuestionsToBank);
router.get('/:questionBankId/questions', getQuestionsInBank);
router.delete('/:questionBankId/questions/:questionId', removeQuestionFromBank);

// Question bank operations
router.get('/:questionBankId/statistics', getQuestionBankStatistics);
router.post('/:questionBankId/duplicate', duplicateQuestionBank);

module.exports = router;
