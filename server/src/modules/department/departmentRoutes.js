const express = require('express');
const router = express.Router();
const departmentController = require('./departmentController');

// Public route to get all active departments
router.get('/', departmentController.getAllDepartments);

module.exports = router;
