const express = require('express');
const router = express.Router();
const {
  registerStep1,
  registerStep2,
  registerStep3,
  registerTeacher,
  getTeacherById,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  // REMOVED: Email OTP functions - Email OTP verification removed from teacher flow
  // sendEmailOTPForTeacher,
  // verifyEmailOTPForTeacher,
  // sendPhoneOTPForTeacher, // REMOVED: Mobile OTP verification removed from teacher flow (similar to organization registration)
  // verifyPhoneOTPForTeacher, // REMOVED: Mobile OTP verification removed from teacher flow (similar to organization registration)
  assignToDepartment,
  removeFromDepartment
} = require('../controllers/teacherController');
const {
  getDashboardStats,
  getRecentExams,
  getRecentQuestionBanks,
  getRecentClasses,
  getRecentAssignments,
  getNavigationCounts
} = require('../controllers/TeacherDashboardController');
const { authenticate } = require('../middleware/auth');

// Multi-step registration routes
router.post('/register/step1', registerStep1);
router.post('/register/step2', registerStep2);
router.post('/register/step3', registerStep3); // FINAL COMMIT - Saves teacher to database

// Legacy single-step registration
router.post('/register', registerTeacher);

// REMOVED: Email OTP routes - Email OTP verification removed from teacher flow
// router.post('/send-email-otp', sendEmailOTPForTeacher);
// router.post('/verify-email-otp', verifyEmailOTPForTeacher);
// REMOVED: Mobile OTP routes removed from teacher flow (similar to organization registration)
// router.post('/send-phone-otp', sendPhoneOTPForTeacher);
// router.post('/verify-phone-otp', verifyPhoneOTPForTeacher);

router.get('/:teacherId', getTeacherById);
router.get('/', getAllTeachers);

// Department assignment routes
router.patch('/:teacherId/department', assignToDepartment);
router.delete('/:teacherId/department/:departmentId', removeFromDepartment);

// Teacher Dashboard routes (require authentication, standalone teachers only)
router.get('/:teacherId/dashboard/stats', authenticate, getDashboardStats);
router.get('/:teacherId/dashboard/exams/recent', authenticate, getRecentExams);
router.get('/:teacherId/dashboard/question-banks/recent', authenticate, getRecentQuestionBanks);
router.get('/:teacherId/dashboard/classes/recent', authenticate, getRecentClasses);
router.get('/:teacherId/dashboard/assignments/recent', authenticate, getRecentAssignments);
router.get('/:teacherId/dashboard/navigation-counts', authenticate, getNavigationCounts);

// Protected routes (require authentication)
// router.put('/:teacherId', auth, updateTeacher);
// router.delete('/:teacherId', auth, deleteTeacher);

module.exports = router;
