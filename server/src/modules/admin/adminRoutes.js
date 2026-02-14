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
// For Development, if you don't have an admin user, comment out checkAdmin
router.post('/generate-id', authenticateToken, checkAdmin, adminController.generateUniqueId);

module.exports = router;
