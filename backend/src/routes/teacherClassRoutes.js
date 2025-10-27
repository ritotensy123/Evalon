const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createTeacherClass,
  getTeacherClasses,
  getTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
  getAvailableStudents,
  addStudentsToClass,
  removeStudentFromClass
} = require('../controllers/teacherClassController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Teacher class routes
router.post('/', createTeacherClass);
router.get('/', getTeacherClasses);
router.get('/:classId', getTeacherClass);
router.put('/:classId', updateTeacherClass);
router.delete('/:classId', deleteTeacherClass);

// Student management routes
router.get('/department/:departmentId/students', getAvailableStudents);
router.post('/:classId/students', addStudentsToClass);
router.delete('/:classId/students/:studentId', removeStudentFromClass);

module.exports = router;
