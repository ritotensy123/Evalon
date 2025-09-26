const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Department CRUD routes
router.post('/', departmentController.createDepartment);
router.get('/', departmentController.getDepartments);
router.get('/tree', departmentController.getDepartmentTree);
router.get('/stats', departmentController.getDepartmentStats);
router.get('/:id', departmentController.getDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

// Teacher assignment routes
router.post('/:departmentId/assign-teacher', departmentController.assignTeacher);

module.exports = router;
