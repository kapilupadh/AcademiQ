// server/src/exam/examRoutes.js
const express = require('express');
const router = express.Router();
const examController = require('./examController');
const { authenticateToken } = require('../../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', examController.getAvailableExams);

// ── STATIC ROUTES FIRST ──────────────────────────────────────────────────────
router.get('/my-results', examController.getMyResults);

router.post('/join', examController.joinExam);
router.post('/mark-absent', examController.markAbsent);
router.post('/answer', examController.saveAnswer);
router.post('/submit', examController.submitExam);
router.post('/violation', examController.logViolation);

// ── PARAM ROUTES LAST ────────────────────────────────────────────────────────
// GET /:examId/status — safe polling used by ExamInstructions waiting room
// NEVER creates an attempt. Just returns {status, start_time}.
router.get('/:examId/status', examController.getExamStatus);

// GET /:examId/result — student's detailed result for one exam (after submission)
router.get('/:examId/result', examController.getMyExamResult);

router.get('/:examId/details', examController.getExamPublicDetails);
router.post('/:examId/start', examController.startExam);

module.exports = router;