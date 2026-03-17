// server/src/modules/academic/academicRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('./academicController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// All academic routes require a valid token — no role restriction
// (admin, teacher, and student all use these)
router.use(authenticateToken);

// Universal endpoints
router.get('/departments',                    controller.getDepartments);
router.get('/departments/:id/programs',       controller.getProgramsByDepartment);
router.get('/programs/:id/subjects',          controller.getSubjectsByProgram);

// Smart filtered endpoint — returns subjects relevant to the caller's role
router.get('/my-subjects',                    controller.getMySubjects);

module.exports = router;