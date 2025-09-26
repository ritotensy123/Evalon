const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Subject CRUD routes
router.post('/', subjectController.createSubject);
router.get('/', subjectController.getSubjects);
router.get('/stats', subjectController.getSubjectStats);
router.get('/category/:category', subjectController.getSubjectsByCategory);
router.get('/department/:departmentId', subjectController.getSubjectsByDepartment);
router.get('/:id', subjectController.getSubject);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

// Coordinator assignment routes
router.post('/:subjectId/assign-coordinator', subjectController.assignCoordinator);

module.exports = router;
