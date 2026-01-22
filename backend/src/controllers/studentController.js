const StudentService = require('../services/StudentService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// Get all students with filtering and pagination
const getStudents = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.user.organization;
  
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    grade: req.query.grade,
    status: req.query.status,
    department: req.query.department
  };

  const result = await StudentService.getStudents(filters, organizationId);

  return sendSuccess(res, result, 'OK', 200);
});

// Get student by ID
const getStudentById = asyncWrapper(async (req, res) => {
  const student = await StudentService.getStudentById(req.params.id);

  return sendSuccess(res, student, 'OK', 200);
});

// Create new student
const createStudent = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.user.organization;
  const createdBy = req.user.id;

  const student = await StudentService.createStudent(req.body, organizationId, createdBy);

  return sendSuccess(res, student, 'Student created successfully', 201);
});

// Update student
const updateStudent = asyncWrapper(async (req, res) => {
  const student = await StudentService.updateStudent(req.params.id, req.body);

  return sendSuccess(res, student, 'Student updated successfully', 200);
});

// Delete student
const deleteStudent = asyncWrapper(async (req, res) => {
  const result = await StudentService.deleteStudent(req.params.id);

  return sendSuccess(res, result, 'Student deleted successfully', 200);
});

// Get student statistics
const getStudentStats = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.user.organization;

  const stats = await StudentService.getStudentStats(organizationId);

  return sendSuccess(res, stats, 'OK', 200);
});

// Assign student to department
const assignToDepartment = asyncWrapper(async (req, res) => {
  const { studentId } = req.params;
  const { departmentId } = req.body;

  const result = await StudentService.assignToDepartment(studentId, departmentId);

  return sendSuccess(res, {
    student: result.student
  }, 'Student assigned to department successfully', 200);
});

// Remove student from department
const removeFromDepartment = asyncWrapper(async (req, res) => {
  const { studentId } = req.params;

  const result = await StudentService.removeFromDepartment(studentId);

  return sendSuccess(res, {
    student: result.student
  }, 'Student removed from department successfully', 200);
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  // Department assignment
  assignToDepartment,
  removeFromDepartment
};
