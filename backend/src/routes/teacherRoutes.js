const express = require('express');
const router = express.Router();
const {
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  registerTeacher,
  getTeacherById,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  sendEmailOTPForTeacher,
  sendPhoneOTPForTeacher,
  verifyEmailOTPForTeacher,
  verifyPhoneOTPForTeacher,
  assignToDepartment,
  removeFromDepartment
} = require('../controllers/teacherController');

// Multi-step registration routes
router.post('/register/step1', registerStep1);
router.post('/register/step2', registerStep2);
router.post('/register/step3', registerStep3);
router.post('/register/step4', registerStep4);

// Legacy single-step registration
router.post('/register', registerTeacher);

// OTP verification routes
router.post('/send-email-otp', sendEmailOTPForTeacher);
router.post('/send-phone-otp', sendPhoneOTPForTeacher);
router.post('/verify-email-otp', verifyEmailOTPForTeacher);
router.post('/verify-phone-otp', verifyPhoneOTPForTeacher);

router.get('/:teacherId', getTeacherById);
router.get('/', getAllTeachers);

// Department assignment routes
router.patch('/:teacherId/department', assignToDepartment);
router.delete('/:teacherId/department/:departmentId', removeFromDepartment);

// Protected routes (require authentication)
// router.put('/:teacherId', auth, updateTeacher);
// router.delete('/:teacherId', auth, deleteTeacher);

module.exports = router;
