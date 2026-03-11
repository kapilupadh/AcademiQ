const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const dashboardController = require('./dashboardController');
const examEngineController = require('./examEngineController');
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireAdmin = require('../../middleware/requireAdmin');
const checkAdmin = requireAdmin;

// ── Departments ───────────────────────────────────────────────────────────────
router.get('/departments',                       authenticateToken,             adminController.getDepartments);
router.post('/departments',                      authenticateToken, checkAdmin, adminController.createDepartment);
router.get('/departments/:deptId/programs',      authenticateToken,             adminController.getProgramsByDepartment);

// ── Subject Management ────────────────────────────────────────────────────────
router.get('/programs/:programId/subjects',      authenticateToken, checkAdmin, adminController.getSubjectsByProgram);
router.delete('/programs/:programId/subjects',   authenticateToken, checkAdmin, adminController.clearProgramSubjects);
router.patch('/subjects/:id',                    authenticateToken, checkAdmin, adminController.updateSubject);
router.delete('/subjects/:id',                   authenticateToken, checkAdmin, adminController.deleteSubject);

// ── Subject Import ────────────────────────────────────────────────────────────
router.post('/subjects/preview',  authenticateToken, checkAdmin, adminController.excelUpload.single('file'), adminController.previewSubjectImport);
router.post('/subjects/bulk-import', authenticateToken, checkAdmin, adminController.excelUpload.single('file'), adminController.bulkImportSubjects);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',       authenticateToken, checkAdmin, dashboardController.getDashboardStats);
router.get('/dashboard/trends',      authenticateToken, checkAdmin, dashboardController.getSessionalTrends);
router.get('/dashboard/heatmap',     authenticateToken, checkAdmin, dashboardController.getAttendanceHeatmap);
router.get('/dashboard/activities',  authenticateToken, checkAdmin, dashboardController.getRecentActivities);
router.get('/dashboard/overview',    authenticateToken, checkAdmin, dashboardController.getDashboardOverview);

// ── Exam Engine ───────────────────────────────────────────────────────────────
router.get('/exams/live-dashboard',              authenticateToken, checkAdmin, examEngineController.getLiveDashboard);
router.get('/questions/repository',              authenticateToken, checkAdmin, examEngineController.getQuestionBankRepository);
router.get('/questions/repository/:examId',      authenticateToken, checkAdmin, examEngineController.getExamQuestionsAdmin);
router.get('/questions/requests',                authenticateToken, checkAdmin, examEngineController.getStudentRequests);
router.post('/questions/requests/:id/approve',   authenticateToken, checkAdmin, examEngineController.approveStudentRequest);
router.get('/evaluations/status',                authenticateToken, checkAdmin, examEngineController.getEvaluationStatus);
router.post('/evaluations/generate',             authenticateToken, checkAdmin, examEngineController.generateReportCards);
router.get('/analytics/post-exam',               authenticateToken, checkAdmin, examEngineController.getPostExamAnalytics);

// ── ID Generation ─────────────────────────────────────────────────────────────
router.post('/generate-id',           authenticateToken, checkAdmin, adminController.generateUniqueId);
router.post('/bulk-generate-ids',     authenticateToken, checkAdmin, adminController.excelUpload.single('file'), adminController.bulkGenerateIds);
router.post('/students/bulk-generate',authenticateToken, checkAdmin, adminController.bulkGenerateStudentsFrontend);

module.exports = router;