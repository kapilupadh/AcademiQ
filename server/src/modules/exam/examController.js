// server/src/modules/exam/examController.js
const { Exam, Question, ExamAttempt, StudentAnswer, Violation, User, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getAvailableExams = async (req, res) => {
  try {
    // Fetch the student's department so we can filter relevant exams
    const student = await User.findByPk(req.user.id, { attributes: ['department_id'] });

    const where = { is_active: true };

    // If the exam has a department set, only show it to students from that department.
    // Exams with no department_id are shown to everyone (e.g. general college-wide tests).
    if (student?.department_id) {
      where[Op.or] = [
        { department_id: student.department_id },
        { department_id: null }
      ];
    }

    const exams = await Exam.findAll({
      where,
      attributes: ['id', 'title', 'description', 'duration_minutes', 'total_questions_to_ask', 'status', 'subject', 'type', 'passing_percentage', 'scheduled_start_at']
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
};

// Returns public exam details a student can see before joining (no OTP needed)
exports.getExamPublicDetails = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findByPk(examId, {
      attributes: ['id', 'title', 'subject', 'type', 'duration_minutes', 'total_questions_to_ask', 'passing_percentage', 'status', 'start_time']
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam details', error: error.message });
  }
};

// Called when student disconnects from the waiting room mid-way
exports.markAbsent = async (req, res) => {
  const { attemptId } = req.body;
  const studentId = req.user.id;
  try {
    const attempt = await ExamAttempt.findOne({ where: { id: attemptId, student_id: studentId } });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    // Only mark ABSENT if still in waiting room (not if already in progress or submitted)
    if (attempt.status === 'WAITING_ROOM') {
      await attempt.update({ status: 'ABSENT' });
    }
    res.json({ message: 'Marked absent' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking absent', error: error.message });
  }
};

exports.joinExam = async (req, res) => {
  const { examId, otp } = req.body;
  const studentId = req.user.id;

  try {
    const exam = await Exam.findByPk(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (exam.status === 'Completed') return res.status(400).json({ message: 'Exam has already concluded' });
    if (exam.status === 'Draft') return res.status(400).json({ message: 'Exam is not open for joining' });

    if (exam.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (new Date() > new Date(exam.otp_expires_at)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check if attempt already exists
    let attempt = await ExamAttempt.findOne({
      where: { student_id: studentId, exam_id: examId }
    });

    if (attempt) {
      if (attempt.status === 'TERMINATED') return res.status(403).json({ message: 'Your exam was terminated' });
      if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') return res.status(400).json({ message: 'Already submitted' });
      
      return res.json({ message: 'Already joined', status: attempt.status, attemptId: attempt.id });
    }

    // CREATE WAITING ROOM ATTEMPT
    // 1. Select Random Questions beforehand so they are ready when exam goes live
    const randomQuestions = await Question.findAll({
      where: { exam_id: examId },
      order: sequelize.random(),
      limit: exam.total_questions_to_ask,
      attributes: ['id']
    });

    if (randomQuestions.length === 0) {
      return res.status(500).json({ message: 'No questions available for this exam' });
    }

    const questionIds = randomQuestions.map(q => q.id);

    // End time is arbitrarily set because it's not started yet.
    // Real end_time will be set by the teacher's starting action.
    attempt = await ExamAttempt.create({
      student_id: studentId,
      exam_id: examId,
      status: 'WAITING_ROOM',
      assigned_questions: questionIds,
      end_time: new Date() // Dummy until started
    });

    res.json({ message: 'Successfully joined waiting room', status: 'WAITING_ROOM', attemptId: attempt.id });
  } catch (error) {
    console.error('joinExam error:', error);
    res.status(500).json({ message: 'Error joining exam', error: error.message });
  }
};

// exports.startExam is repurposed for student polling / fetching of questions when exam goes LIVE
exports.startExam = async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user.id;

  try {
    const exam = await Exam.findByPk(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    let attempt = await ExamAttempt.findOne({
      where: {
        student_id: studentId,
        exam_id: examId,
      },
    });

    if (!attempt) {
       return res.status(403).json({ message: 'Please join the exam room first' });
    }

    if (attempt.status === 'WAITING_ROOM') {
      if (exam.status === 'Live') {
         // Auto fix attempt status in case the teacher's mass update missed this late joiner occasionally, 
         // though the API handles late join via a race condition.
         // Wait, the plan says: students join using OTP within 5 minutes.
         // If teacher started, they are updated in bulk.
         attempt.status = 'IN_PROGRESS';
         attempt.start_time = new Date();
         attempt.end_time = new Date(Date.now() + exam.duration_minutes * 60000);
         await attempt.save();
      } else {
         return res.json({ status: 'WAITING_ROOM', message: 'Waiting for teacher to start' });
      }
    }

    if (attempt.status === 'IN_PROGRESS') {
       if (new Date() > attempt.end_time || exam.status === 'Completed') {
         attempt.status = 'AUTO_SUBMITTED';
         await attempt.save();
         return res.status(400).json({ message: 'Exam time expired or exam ended.' });
       }

       const assignedQuestionIds = attempt.assigned_questions;
       const questions = await Question.findAll({
         where: { id: assignedQuestionIds },
         attributes: ['id', 'question_text', 'question_type', 'options', 'marks', 'image_url']
       });

       return res.json({
         status: 'IN_PROGRESS',
         attemptId: attempt.id,
         startTime: attempt.start_time,
         endTime: attempt.end_time,
         questions,
         resumed: true
       });
    }

    return res.status(400).json({ message: 'Cannot start or resume exam. Current status: ' + attempt.status });

  } catch (error) {
    res.status(500).json({ message: 'Error starting exam', error: error.message });
  }
};

exports.saveAnswer = async (req, res) => {
  const { attemptId, questionId, selectedOption } = req.body;
  const studentId = req.user.id;

  try {
    const attempt = await ExamAttempt.findOne({ where: { id: attemptId, student_id: studentId } });
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return res.status(403).json({ message: 'Invalid or finished attempt' });
    }

    if (new Date() > attempt.end_time) {
      return res.status(403).json({ message: 'Time expired' });
    }

    // Upsert answer
    const [answer, created] = await StudentAnswer.findOrCreate({
      where: { attempt_id: attemptId, question_id: questionId },
      defaults: { selected_option: selectedOption }
    });

    if (!created) {
      answer.selected_option = selectedOption;
      await answer.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error saving answer', error: error.message });
  }
};

exports.submitExam = async (req, res) => {
  const { attemptId } = req.body;
  const studentId = req.user.id;

  try {
    const attempt = await ExamAttempt.findOne({ where: { id: attemptId, student_id: studentId } });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
      return res.status(400).json({ message: 'Already submitted' });
    }

    // SCORING LOGIC
    // Fetch all answers
    const studentAnswers = await StudentAnswer.findAll({ where: { attempt_id: attemptId } });
    
    // Fetch all assigned questions with correct answers
    const questions = await Question.findAll({
      where: { id: attempt.assigned_questions }
    });

    let totalScore = 0;
    
    questions.forEach(q => {
      const ans = studentAnswers.find(a => a.question_id === q.id);
      if (ans && ans.selected_option === q.correct_answer) {
        totalScore += q.marks;
      }
    });

    attempt.score = totalScore;
    attempt.status = 'SUBMITTED';
    await attempt.save();

    res.json({ success: true, score: totalScore, status: 'SUBMITTED' });

  } catch (error) {
    res.status(500).json({ message: 'Error submitting exam', error: error.message });
  }
};

exports.logViolation = async (req, res) => {
  const { attemptId, type } = req.body;
  const studentId = req.user.id;

  try {
    const attempt = await ExamAttempt.findOne({ where: { id: attemptId, student_id: studentId } });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ message: 'Exam not in progress' });

    await Violation.create({
      attempt_id: attemptId,
      type: type
    });

    attempt.violation_count += 1;
    
    // Auto terminate logic (optional)
    if (attempt.violation_count > 5) { // Threshold
       attempt.status = 'TERMINATED';
       await attempt.save();
       return res.status(403).json({ message: 'Exam terminated due to multiple violations', terminated: true });
    }

    await attempt.save();
    res.json({ success: true, warningCount: attempt.violation_count });

  } catch (error) {
    res.status(500).json({ message: 'Error logging violation', error: error.message });
  }
};

// GET /api/exam/results — all past attempts for the logged-in student
exports.getMyResults = async (req, res) => {
  const studentId = req.user.id;
  try {
    const attempts = await ExamAttempt.findAll({
      where: {
        student_id: studentId,
        status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED', 'TERMINATED', 'ABSENT'] }
      },
      include: [{
        model: Exam,
        attributes: ['id', 'title', 'subject', 'type', 'passing_percentage', 'total_questions_to_ask']
      }],
      order: [['updatedAt', 'DESC']]
    });

    const results = attempts.map(a => {
      const totalQuestions = Array.isArray(a.assigned_questions) ? a.assigned_questions.length : 0;
      const passed = a.score !== null && a.Exam
        ? (a.score / (totalQuestions || 1)) * 100 >= a.Exam.passing_percentage
        : false;

      return {
        attemptId: a.id,
        examId: a.exam_id,
        examTitle: a.Exam?.title || 'Unknown',
        subject: a.Exam?.subject || 'N/A',
        type: a.Exam?.type || 'N/A',
        score: a.score,
        totalQuestions,
        status: a.status,
        passed,
        submittedAt: a.updatedAt
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
};
// Only returns exam status — NEVER creates or modifies an attempt.
exports.getExamStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findByPk(examId, {
      attributes: ['id', 'status', 'start_time'],
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ status: exam.status, start_time: exam.start_time });
  } catch (error) {
    console.error('getExamStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// GET /api/exam/:examId/result — detailed result for one exam
exports.getMyExamResult = async (req, res) => {
  const studentId = req.user.id;
  const { examId } = req.params;
  try {
    const attempt = await ExamAttempt.findOne({
      where: { student_id: studentId, exam_id: examId },
      include: [{
        model: Exam,
        attributes: ['id', 'title', 'subject', 'type', 'passing_percentage']
      }]
    });

    if (!attempt) return res.status(404).json({ message: 'No attempt found for this exam' });

    const isFinished = ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED', 'TERMINATED', 'ABSENT'].includes(attempt.status);
    if (!isFinished) {
      return res.status(400).json({ message: 'Exam not yet submitted' });
    }

    // Fetch student's answers with correct answers for review
    const answers = await StudentAnswer.findAll({
      where: { attempt_id: attempt.id },
      include: [{
        model: Question,
        attributes: ['id', 'question_text', 'options', 'correct_answer', 'marks', 'image_url']
      }]
    });

    const answerReview = answers.map(a => ({
      questionId: a.question_id,
      questionText: a.Question?.question_text,
      options: a.Question?.options,
      selectedOption: a.selected_option,
      correctAnswer: a.Question?.correct_answer,
      marks: a.Question?.marks || 1,
      isCorrect: a.selected_option === a.Question?.correct_answer
    }));

    const totalQuestions = Array.isArray(attempt.assigned_questions) ? attempt.assigned_questions.length : 0;
    const passed = attempt.score !== null && attempt.Exam
      ? (attempt.score / (totalQuestions || 1)) * 100 >= attempt.Exam.passing_percentage
      : false;

    res.json({
      attemptId: attempt.id,
      exam: {
        id: attempt.Exam?.id,
        title: attempt.Exam?.title,
        subject: attempt.Exam?.subject,
        type: attempt.Exam?.type,
        passingPercentage: attempt.Exam?.passing_percentage
      },
      score: attempt.score,
      totalQuestions,
      status: attempt.status,
      passed,
      violationCount: attempt.violation_count,
      submittedAt: attempt.updatedAt,
      answerReview
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching result', error: error.message });
  }
};