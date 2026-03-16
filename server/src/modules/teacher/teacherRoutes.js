const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireTeacher = require('../../middleware/requireTeacher');
const teacherExamController = require('./examController');
const upload = require('../../middleware/uploadMiddleware');

// Upload route: only needs a valid auth token (no teacher role check needed)
router.post('/upload', authenticateToken, upload.single('image'), teacherExamController.uploadQuestionImage);

// All other teacher routes: require teacher or admin role
router.use(authenticateToken, requireTeacher);


router.get('/departments', teacherExamController.getDepartments);
router.get('/exams', teacherExamController.getTeacherExams);
router.post('/exams', teacherExamController.createExam);
router.get('/exams/:id', teacherExamController.getExamDetails);
router.put('/exams/:id', teacherExamController.updateExam);
router.delete('/exams/:id', teacherExamController.deleteExam);
router.post('/exams/:id/questions', teacherExamController.addOrUpdateQuestions);
router.post('/exams/:id/generate-otp', teacherExamController.generateExamOtp);
router.post('/exams/:id/start', teacherExamController.startExam);
router.post('/exams/:id/end', teacherExamController.endExam);
router.get('/exams/:id/submissions', teacherExamController.getExamSubmissions);

module.exports = router;