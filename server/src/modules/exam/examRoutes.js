const express = require('express');
const router = express.Router();
const examController = require('./examController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// All routes below are protected
router.use(authenticateToken);

router.get('/', examController.getAvailableExams);

// ── 1. STATIC ROUTES GO FIRST ──
router.get('/my-results', examController.getMyResults);
// NOTE: We changed /my-results/:attemptId to /:examId/result to match your controller comment
router.get('/:examId/result', examController.getMyExamResult); 

router.post('/join', examController.joinExam);
router.post('/mark-absent', examController.markAbsent);
router.post('/answer', examController.saveAnswer);
router.post('/submit', examController.submitExam);
router.post('/violation', examController.logViolation);

// ── 2. WILDCARD PARAMETER ROUTES GO LAST ──
router.get('/:examId/details', examController.getExamPublicDetails);
router.post('/:examId/start', examController.startExam);

module.exports = router;