// server/src/modules/teacher/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const requireTeacher = require('../../middleware/requireTeacher');
const teacherExamController = require('./examController');
const teacherSubjectController = require('./teacherSubjectController');
const upload = require('../../middleware/uploadMiddleware');

// Upload route
router.post('/upload', authenticateToken, upload.single('image'), teacherExamController.uploadQuestionImage);

// All other routes require teacher role
router.use(authenticateToken, requireTeacher);

// ── Exam routes ───────────────────────────────────────────────────────────────
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

// ── Subject claiming routes ───────────────────────────────────────────────────
router.get('/my-subjects',                    teacherSubjectController.getMySubjects);
router.get('/available-subjects/semesters',   teacherSubjectController.getAvailableSemesters);
router.get('/available-subjects',             teacherSubjectController.getAvailableSubjects);
router.post('/my-subjects/claim',             teacherSubjectController.claimSubject);
router.delete('/my-subjects/:subject_id',     teacherSubjectController.unclaimSubject);

module.exports = router;