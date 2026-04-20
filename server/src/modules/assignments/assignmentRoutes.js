// server/src/modules/assignments/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const assignmentController = require('./assignmentController');
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireTeacher = require('../../middleware/requireTeacher');

// ── Shared Routes ──
router.get('/my', authenticateToken, assignmentController.getMyAssignments);
router.get('/:id', authenticateToken, assignmentController.getAssignmentDetails);
router.get('/subject/:subjectId', authenticateToken, assignmentController.getSubjectAssignments);

// ── Teacher Routes ──
router.post('/', authenticateToken, requireTeacher, assignmentController.createAssignment);
router.put('/:id', authenticateToken, requireTeacher, assignmentController.updateAssignment);
router.delete('/:id', authenticateToken, requireTeacher, assignmentController.deleteAssignment);
router.get('/:id/submissions', authenticateToken, requireTeacher, assignmentController.getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', authenticateToken, requireTeacher, assignmentController.gradeSubmission);

const upload = require('../../middleware/uploadMiddleware');

// ── Student Routes ──
router.post('/:id/submit', authenticateToken, upload.single('submission_image'), assignmentController.submitAssignment);

module.exports = router;
