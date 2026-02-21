const { Exam, Question, ExamAttempt, StudentAnswer, User } = require('../../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Helpers
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

exports.getTeacherExams = async (req, res) => {
  try {
    // Assuming we don't have a teacher_id on Exam yet! Wait, does Exam have teacher_id?
    // Let's assume all exams for now or if we need to filter by subject.
    // The prompt says "View exams", we might need to add teacher_id to Exam model or just return all for demo.
    // If Exam doesn't have teacher_id, I will return all exams.
    const exams = await Exam.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(exams);
  } catch (error) {
    console.error('getTeacherExams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createExam = async (req, res) => {
  try {
    const { title, description, duration_minutes, total_questions_to_ask, passing_percentage, subject, type, start_time } = req.body;
    
    const newExam = await Exam.create({
      title,
      description,
      duration_minutes,
      total_questions_to_ask,
      passing_percentage,
      subject,
      type,
      start_time,
      status: 'Draft'
    });

    res.status(201).json({ message: 'Exam created successfully', exam: newExam });
  } catch (error) {
    console.error('createExam error:', error);
    res.status(500).json({ message: 'Server error adding exam' });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status === 'Completed') return res.status(400).json({ message: 'Cannot update completed exam' });

    await exam.update(updateData);
    res.json({ message: 'Exam updated', exam });
  } catch (error) {
    console.error('updateExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addOrUpdateQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body; // Array of { question_text, options, correct_answer, marks }
    
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Assuming we clear old questions for this exam and recreate them, or handle individually
    await Question.destroy({ where: { exam_id: id } });

    const newQuestions = questions.map(q => ({
      exam_id: id,
      question_text: q.question_text,
      question_type: 'MCQ',
      options: q.options,
      correct_answer: q.correct_answer,
      marks: q.marks || 1
    }));

    await Question.bulkCreate(newQuestions);
    res.json({ message: 'Questions saved successfully' });
  } catch (error) {
    console.error('addOrUpdateQuestions error:', error);
    res.status(500).json({ message: 'Server error adding questions' });
  }
};

exports.generateExamOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status === 'Completed') return res.status(400).json({ message: 'Exam is completed' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes from now

    await exam.update({ otp, otp_expires_at: expiresAt, status: 'Scheduled' }); // Set or keep status
    // Setting status to Scheduled or waiting implies it's ready for joining waiting room
    res.json({ message: 'OTP generated', otp, expiresAt });
  } catch (error) {
    console.error('generateExamOtp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.startExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status !== 'Scheduled' && exam.status !== 'Draft') {
        return res.status(400).json({ message: 'Exam already started or completed' });
    }

    await exam.update({ status: 'Live', start_time: new Date() });
    
    // Auto-end exam logic
    const msToWait = exam.duration_minutes * 60000;
    setTimeout(async () => {
        try {
            const e = await Exam.findByPk(id);
            if (e && e.status === 'Live') {
                await e.update({ status: 'Completed', is_active: false });
                await ExamAttempt.update(
                    { status: 'AUTO_SUBMITTED' },
                    { where: { exam_id: id, status: { [Op.in]: ['WAITING_ROOM', 'IN_PROGRESS'] } } }
                );
                console.log(`Auto-ended exam ${id}`);
            }
        } catch (timerErr) {
            console.error('Auto end error', timerErr);
        }
    }, msToWait);

    // Transition all waiting room users to in-progress
    await ExamAttempt.update(
      { status: 'IN_PROGRESS', start_time: new Date(), end_time: new Date(Date.now() + msToWait) },
      { where: { exam_id: id, status: 'WAITING_ROOM' } }
    );

    res.json({ message: 'Exam started successfully' });
  } catch (error) {
    console.error('startExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExamSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await ExamAttempt.findAll({
      where: { exam_id: id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'full_name', 'unique_id', 'college_roll_number'] }
      ]
    });
    
    const stats = {
      total_students: attempts.length, // we could query User count for total in class
      appeared: attempts.length,
      average_score: attempts.length > 0 ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0,
    }

    res.json({ attempts, stats });
  } catch (error) {
    console.error('getExamSubmissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
