const express = require('express');
const router = express.Router();
const authController = require('./authController');
const accessRequestController = require('./accessRequestController');

const { authenticateToken } = require('../../middleware/authMiddleware');
const requireAdmin = require('../../middleware/requireAdmin');

// POST /api/auth/admin-register  (secured by ADMIN_SETUP_CODE)
router.post('/admin-register', authController.adminRegister);

// POST /api/auth/validate-id (Step 1)
router.post('/validate-id', authController.validateId);

// POST /api/auth/check-email (Optional Check)
router.post('/check-email', authController.checkEmail);

// POST /api/auth/register (Step 2 - Final)
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOTP);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/dashboard-student 
router.get('/dashboard', authenticateToken, authController.getStudentDashboard);

// --- Access Requests ---
router.post('/access-request', accessRequestController.submitRequest);
router.get('/access-requests', authenticateToken, requireAdmin, accessRequestController.getRequests);
router.post('/access-requests/:id/action', authenticateToken, requireAdmin, accessRequestController.handleAction);
router.delete('/access-requests/:id', authenticateToken, requireAdmin, accessRequestController.deleteRequest);

// --- Protected Routes ---
router.get('/me', authenticateToken, authController.getProfile);
router.put('/me', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
