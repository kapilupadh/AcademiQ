const express = require('express');
const router = express.Router();
const examController = require('./examController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// All routes are protected
router.use(authenticateToken);

router.get('/', examController.getAvailableExams);
router.post('/:examId/start', examController.startExam);
router.post('/answer', examController.saveAnswer); // Body: { attemptId, questionId, selectedOption }
router.post('/submit', examController.submitExam); // Body: { attemptId }
router.post('/violation', examController.logViolation); // Body: { attemptId, type }

module.exports = router;
