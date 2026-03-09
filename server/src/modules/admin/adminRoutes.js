const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const dashboardController = require('./dashboardController');
const examEngineController = require('./examEngineController');
const { authenticateToken } = require('../../middleware/authMiddleware');

const requireAdmin = require('../../middleware/requireAdmin');

// Middleware to check if user is admin
// We use requireAdmin instead of local checkAdmin
const checkAdmin = requireAdmin;

// Dashboard Routes
router.get('/dashboard/stats', authenticateToken, checkAdmin, dashboardController.getDashboardStats);
router.get('/dashboard/trends', authenticateToken, checkAdmin, dashboardController.getSessionalTrends);
router.get('/dashboard/heatmap', authenticateToken, checkAdmin, dashboardController.getAttendanceHeatmap);
router.get('/dashboard/activities', authenticateToken, checkAdmin, dashboardController.getRecentActivities);
router.get('/dashboard/overview', authenticateToken, checkAdmin, dashboardController.getDashboardOverview);

// Exam Engine Routes (Redesigned UI)
router.get('/exams/live-dashboard', authenticateToken, checkAdmin, examEngineController.getLiveDashboard);
router.get('/questions/repository', authenticateToken, checkAdmin, examEngineController.getQuestionBankRepository);
router.get('/questions/repository/:examId', authenticateToken, checkAdmin, examEngineController.getExamQuestionsAdmin);
router.get('/questions/requests', authenticateToken, checkAdmin, examEngineController.getStudentRequests);
router.post('/questions/requests/:id/approve', authenticateToken, checkAdmin, examEngineController.approveStudentRequest);
router.get('/evaluations/status', authenticateToken, checkAdmin, examEngineController.getEvaluationStatus);
router.post('/evaluations/generate', authenticateToken, checkAdmin, examEngineController.generateReportCards);
router.get('/analytics/post-exam', authenticateToken, checkAdmin, examEngineController.getPostExamAnalytics);

// POST /api/admin/generate-id
router.post('/generate-id', authenticateToken, checkAdmin, adminController.generateUniqueId);

// POST /api/admin/bulk-generate-ids  (Excel upload → Excel download)
router.post(
  '/bulk-generate-ids',
  authenticateToken,
  checkAdmin,
  adminController.excelUpload.single('file'),
  adminController.bulkGenerateIds
);

// POST /api/admin/students/bulk-generate (Frontend parses file, sends array of students)
router.post('/students/bulk-generate', authenticateToken, checkAdmin, adminController.bulkGenerateStudentsFrontend);

module.exports = router;
