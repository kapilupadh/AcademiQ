const express = require('express');
const router = express.Router();
const authController = require('./authController');

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

module.exports = router;
