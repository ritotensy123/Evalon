const express = require('express');
const router = express.Router();
const bulkUploadController = require('../controllers/bulkUploadController');
const auth = require('../middleware/auth');

// Generate CSV template for teacher bulk upload
router.get('/template/teacher', auth.authenticate, async (req, res) => {
  try {
    await bulkUploadController.generateTeacherTemplate(req, res);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template'
    });
  }
});

// Bulk create teachers from CSV data
router.post('/teachers', auth.authenticate, async (req, res) => {
  try {
    await bulkUploadController.bulkCreateTeachers(req, res);
  } catch (error) {
    console.error('Bulk creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create teachers'
    });
  }
});

module.exports = router;
