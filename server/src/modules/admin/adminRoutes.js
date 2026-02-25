const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const dashboardController = require('./dashboardController');
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

module.exports = router;
