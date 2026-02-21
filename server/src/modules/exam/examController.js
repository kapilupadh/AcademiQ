const { Exam, Question, ExamAttempt, StudentAnswer, Violation, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getAvailableExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'description', 'duration_minutes', 'total_questions_to_ask', 'status']
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
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
         attributes: ['id', 'question_text', 'question_type', 'options', 'marks']
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
