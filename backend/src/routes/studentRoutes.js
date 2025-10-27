const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  assignToDepartment,
  removeFromDepartment
} = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticate);

// Student routes
router.get('/', getStudents);
router.get('/stats', getStudentStats);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

// Department assignment routes
router.patch('/:studentId/department', assignToDepartment);
router.delete('/:studentId/department/:departmentId', removeFromDepartment);

module.exports = router;