const { Exam, Question, ExamAttempt, StudentAnswer, Violation, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getAvailableExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'description', 'duration_minutes', 'total_questions_to_ask']
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
};

exports.startExam = async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user.id; // From middleware

  try {
    const exam = await Exam.findByPk(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Check for existing 'IN_PROGRESS' attempt
    let attempt = await ExamAttempt.findOne({
      where: {
        student_id: studentId,
        exam_id: examId,
        status: 'IN_PROGRESS',
      },
    });

    // If active attempt exists, return it (RESUME functionality)
    if (attempt) {
       // Check if time expired
       if (new Date() > attempt.end_time) {
         attempt.status = 'AUTO_SUBMITTED';
         await attempt.save();
         return res.status(400).json({ message: 'Exam time expired' });
       }

       // Fetch questions for this attempt
       const assignedQuestionIds = attempt.assigned_questions;
       const questions = await Question.findAll({
         where: { id: assignedQuestionIds },
         attributes: ['id', 'question_text', 'question_type', 'options', 'marks'] // No correct_answer
       });

       return res.json({
         attemptId: attempt.id,
         startTime: attempt.start_time,
         endTime: attempt.end_time,
         questions,
         resumed: true
       });
    }

    // CREATE NEW ATTEMPT
    // 1. Select Random Questions
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
    const endTime = new Date(Date.now() + exam.duration_minutes * 60000);

    attempt = await ExamAttempt.create({
      student_id: studentId,
      exam_id: examId,
      status: 'IN_PROGRESS',
      start_time: new Date(),
      end_time: endTime,
      assigned_questions: questionIds
    });

    const questions = await Question.findAll({
      where: { id: questionIds },
      attributes: ['id', 'question_text', 'question_type', 'options', 'marks']
    });

    res.json({
      attemptId: attempt.id,
      startTime: attempt.start_time,
      endTime: attempt.end_time,
      questions,
      resumed: false
    });

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
