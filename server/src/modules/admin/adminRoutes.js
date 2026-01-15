const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // For V1, we might not have a seeded admin yet.
    // If no user is logged in, restrict.
    // Use a backdoor or secret for now if no admin exists?
    // Let's stick to strict: Must be admin.
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

// POST /api/admin/generate-id
// For Development, if you don't have an admin user, comment out checkAdmin
router.post('/generate-id', authenticateToken, checkAdmin, adminController.generateUniqueId);

module.exports = router;
