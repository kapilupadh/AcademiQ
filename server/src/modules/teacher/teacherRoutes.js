const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireTeacher = require('../../middleware/requireTeacher');
const teacherExamController = require('./examController');

router.use(authenticateToken, requireTeacher);

router.get('/exams', teacherExamController.getTeacherExams);
router.post('/exams', teacherExamController.createExam);
router.put('/exams/:id', teacherExamController.updateExam);
router.post('/exams/:id/questions', teacherExamController.addOrUpdateQuestions);
router.post('/exams/:id/generate-otp', teacherExamController.generateExamOtp);
router.post('/exams/:id/start', teacherExamController.startExam);
router.get('/exams/:id/submissions', teacherExamController.getExamSubmissions);

module.exports = router;
