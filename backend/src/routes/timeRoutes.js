/**
 * Time Routes
 * Handles time synchronization and exam countdown endpoints
 */

const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');

// GET /api/v1/time - Get current server time (public)
router.get('/', timeController.getServerTime);

// GET /api/v1/time/exam/:examId/countdown - Get exam countdown (public for now)
router.get('/exam/:examId/countdown', timeController.getExamCountdown);

module.exports = router;



