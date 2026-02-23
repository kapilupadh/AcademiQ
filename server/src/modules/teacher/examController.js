const { Exam, Question, ExamAttempt, StudentAnswer, User, Department, Subject, StudentSubject } = require('../../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { sendExamScheduleNotification } = require('../../utils/emailService');

/**
 * Strict email targeting:
 * Tier 1 (preferred) — subject_id set on exam:
 *   Query StudentSubject where subject_id = exam.subject_id AND is_eligible = true,
 *   join User where is_active = true AND same department as exam.
 * Tier 2 (fallback for legacy exams with no subject_id):
 *   All active students in the same department + same semester.
 * Guard: if recipient list is empty, log a warning and skip sending.
 */
const notifyStudentsAboutExam = async (exam, isUpdate = false) => {
  try {
    let emails = [];
    let tierUsed = 'none';

    // Re-fetch exam with associations to get department name
    const fullExam = await Exam.findByPk(exam.id, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Subject, attributes: ['name', 'code'] },
      ],
    });

    if (exam.subject_id) {
      // ── Tier 1: enrollment-level targeting ─────────────────────────────
      const enrollments = await StudentSubject.findAll({
        where: { subject_id: exam.subject_id, is_eligible: true },
        include: [{
          model: User,
          as: 'student',
          where: {
            role: 3,
            is_active: true,
            ...(exam.department_id ? { department_id: exam.department_id } : {}),
          },
          attributes: ['email'],
        }],
      });
      emails = enrollments.map(e => e.student?.email).filter(Boolean);
      tierUsed = 'subject-enrollment';
    } else if (exam.department_id) {
      // ── Tier 2: department + semester fallback ──────────────────────────
      const where = { role: 3, is_active: true, department_id: exam.department_id };
      const students = await User.findAll({ where, attributes: ['email'] });
      emails = students.map(s => s.email).filter(Boolean);
      tierUsed = 'department-fallback';
    }

    if (emails.length === 0) {
      console.warn(`[Email] No eligible recipients found for exam "${exam.title}" (tier: ${tierUsed}). Skipping notification.`);
      return;
    }

    // Enrich exam data with resolved department/subject names for email
    const enrichedExam = {
      ...exam.dataValues,
      departmentName: fullExam?.Department?.name || null,
      subjectName: fullExam?.Subject?.name || exam.subject || null,
      semester: exam.semester || null,
    };

    console.log(`[Email] Sending exam notification (${isUpdate ? 'update' : 'new'}) to ${emails.length} students via tier: ${tierUsed}`);

    // Fire-and-forget — don't block API response
    sendExamScheduleNotification(emails, enrichedExam, isUpdate)
      .then(r => console.log(`[Email] Done: sent=${r.sent}, failed=${r.failed}`))
      .catch(err => console.error('[Email] Notification error:', err));

  } catch (err) {
    console.error('[Email] Failed to build recipient list:', err);
  }
};

// Helpers
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

exports.getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(exams);
  } catch (error) {
    console.error('getTeacherExams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id, {
      include: [{ model: Question, as: 'questions' }]
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    console.error('getExamDetails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createExam = async (req, res) => {
  try {
    const {
      title, description, duration_minutes, total_questions_to_ask,
      passing_percentage, subject, type, start_time,
      scheduled_start_at, scheduled_end_at
    } = req.body;

    // Validate schedule if provided
    if (scheduled_start_at && scheduled_end_at) {
      if (new Date(scheduled_start_at) >= new Date(scheduled_end_at)) {
        return res.status(400).json({ message: 'Scheduled start time must be before end time' });
      }
      if (new Date(scheduled_start_at) <= new Date()) {
        return res.status(400).json({ message: 'Scheduled start time must be in the future' });
      }
    }

    const newExam = await Exam.create({
      title, description, duration_minutes, total_questions_to_ask,
      passing_percentage, subject, type, start_time,
      scheduled_start_at: scheduled_start_at || null,
      scheduled_end_at: scheduled_end_at || null,
      status: 'Draft'
    });

    // Notify students if schedule provided
    if (scheduled_start_at && scheduled_end_at) {
      notifyStudentsAboutExam(newExam, false);
    }

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

    // Validate schedule if being updated
    const newStart = updateData.scheduled_start_at;
    const newEnd = updateData.scheduled_end_at;
    if (newStart && newEnd) {
      if (new Date(newStart) >= new Date(newEnd)) {
        return res.status(400).json({ message: 'Scheduled start time must be before end time' });
      }
      if (new Date(newStart) <= new Date()) {
        return res.status(400).json({ message: 'Scheduled start time must be in the future' });
      }
    }

    // Detect if schedule actually changed (for idempotency — avoid duplicate emails)
    const prevStart = exam.scheduled_start_at ? new Date(exam.scheduled_start_at).toISOString() : null;
    const prevEnd = exam.scheduled_end_at ? new Date(exam.scheduled_end_at).toISOString() : null;
    const scheduleChanged =
      (newStart && newStart !== prevStart) || (newEnd && newEnd !== prevEnd);

    await exam.update(updateData);

    // Notify students only if schedule was set or changed
    if (scheduleChanged && newStart && newEnd) {
      notifyStudentsAboutExam(exam, true);
    }

    res.json({ message: 'Exam updated', exam });
  } catch (error) {
    console.error('updateExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    // Return relative url where frontend can map to backend url
    // Server is serving /public for ../public
    // Image is saved in public/uploads -> so URL is /public/uploads/filename
    const imageUrl = `/public/uploads/${req.file.filename}`;
    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    console.error('uploadQuestionImage error:', error);
    res.status(500).json({ message: 'Server error uploading image' });
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
      marks: q.marks || 1,
      image_url: q.image_url || null
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
    // expiryMinutes: how long the OTP is valid. Default 5 minutes
    const expiryMinutes = parseInt(req.body.expiryMinutes) || 5;
    if (expiryMinutes < 1 || expiryMinutes > 60) {
      return res.status(400).json({ message: 'Expiry must be between 1 and 60 minutes' });
    }

    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status === 'Completed' || exam.status === 'Live') {
      return res.status(400).json({ message: 'Cannot generate OTP for a Live or Completed exam' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60000);

    await exam.update({ otp, otp_expires_at: expiresAt, status: 'Scheduled' });
    res.json({ message: 'OTP generated', otp, expiresAt, expiryMinutes });
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

exports.endExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status === 'Completed') {
      return res.status(400).json({ message: 'Exam is already completed' });
    }

    // Mark the exam as completed
    await exam.update({ status: 'Completed', is_active: false });

    // Auto-submit all active and waiting attempts
    await ExamAttempt.update(
      { status: 'FORCE_SUBMITTED' },
      {
        where: {
          exam_id: id,
          status: { [Op.in]: ['WAITING_ROOM', 'IN_PROGRESS'] }
        }
      }
    );

    const affectedCount = await ExamAttempt.count({
      where: { exam_id: id, status: 'FORCE_SUBMITTED' }
    });

    res.json({ message: 'Exam force-ended successfully', affectedStudents: affectedCount });
  } catch (error) {
    console.error('endExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
