// server/src/modules/teacher/examController.js
// Changes from previous version:
//   1. getTeacherExams  — also returns exams where created_by IS NULL (legacy) for teachers in same dept
//   2. createExam       — saves department_id, semester, subject_id from req.body
//   3. updateExam       — allows updating department_id, semester, subject_id
//   4. getExamStatus    — NEW: safe polling endpoint (no attempt creation)

const { Exam, Question, ExamAttempt, StudentAnswer, User, Department, Subject, StudentSubject } = require('../../models');
const { Op } = require('sequelize');
const { sendExamScheduleNotification } = require('../../utils/emailService');

// ─── Email Notification Helper ────────────────────────────────────────────────
const notifyStudentsAboutExam = async (exam, isUpdate = false) => {
  try {
    let emails = [];
    let tierUsed = 'none';

    const fullExam = await Exam.findByPk(exam.id, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Subject, attributes: ['name', 'code'] },
      ],
    });

    if (exam.subject_id) {
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
      const students = await User.findAll({
        where: { role: 3, is_active: true, department_id: exam.department_id },
        attributes: ['email'],
      });
      emails = students.map(s => s.email).filter(Boolean);
      tierUsed = 'department-fallback';
    }

    if (emails.length === 0) {
      console.warn(`[Email] No eligible recipients for exam "${exam.title}" (tier: ${tierUsed}). Skipping.`);
      return;
    }

    const enrichedExam = {
      ...exam.dataValues,
      departmentName: fullExam?.Department?.name || null,
      subjectName: fullExam?.Subject?.name || exam.subject || null,
      semester: exam.semester || null,
    };

    sendExamScheduleNotification(emails, enrichedExam, isUpdate)
      .then(r => console.log(`[Email] Done: sent=${r.sent}, failed=${r.failed}`))
      .catch(err => console.error('[Email] Notification error:', err));

  } catch (err) {
    console.error('[Email] Failed to build recipient list:', err);
  }
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── GET /teacher/exams ───────────────────────────────────────────────────────
// Teachers see:
//   (a) exams they created (created_by = their id)
//   (b) legacy exams with null created_by that belong to their department
// Admins see everything.
exports.getTeacherExams = async (req, res) => {
  try {
    const { role, id: userId, department_id } = req.user;

    let where = {};

    if (role !== 1) {
      // Teacher: their own exams OR legacy null-created_by exams in same dept
      const conditions = [{ created_by: userId }];

      if (department_id) {
        conditions.push({
          created_by: null,
          department_id: department_id,
        });
      } else {
        // No dept set on teacher — just show null created_by exams as fallback
        conditions.push({ created_by: null });
      }

      where = { [Op.or]: conditions };
    }
    // Admin: where = {} → sees all

    const exams = await Exam.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json(exams);
  } catch (error) {
    console.error('getTeacherExams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /teacher/exams/:id ───────────────────────────────────────────────────
exports.getExamDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id, {
      include: [{ model: Question, as: 'questions' }],
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    console.error('getExamDetails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /teacher/exams ──────────────────────────────────────────────────────
// Now saves department_id, semester, subject_id from body
// Falls back to teacher's own department_id if not provided
exports.createExam = async (req, res) => {
  try {
    const {
      title, description, duration_minutes, total_questions_to_ask,
      passing_percentage, subject, type, start_time,
      scheduled_start_at, scheduled_end_at,
      department_id, semester, subject_id,
    } = req.body;

    // Use provided department_id, or fall back to the teacher's own dept
    const resolvedDeptId = department_id || req.user.department_id || null;

    if (scheduled_start_at && scheduled_end_at) {
      if (new Date(scheduled_start_at) >= new Date(scheduled_end_at)) {
        return res.status(400).json({ message: 'Scheduled start time must be before end time' });
      }
      if (new Date(scheduled_start_at) <= new Date()) {
        return res.status(400).json({ message: 'Scheduled start time must be in the future' });
      }
    }

    const newExam = await Exam.create({
      title,
      description,
      duration_minutes,
      total_questions_to_ask,
      passing_percentage,
      subject,
      type,
      start_time,
      scheduled_start_at: scheduled_start_at || null,
      scheduled_end_at: scheduled_end_at || null,
      status: 'Draft',
      created_by: req.user.id,
      department_id: resolvedDeptId,
      semester: semester || null,
      subject_id: subject_id || null,
    });

    if (scheduled_start_at && scheduled_end_at) {
      notifyStudentsAboutExam(newExam, false);
    }

    res.status(201).json({ message: 'Exam created successfully', exam: newExam });
  } catch (error) {
    console.error('createExam error:', error);
    res.status(500).json({ message: 'Server error adding exam' });
  }
};

// ─── PUT /teacher/exams/:id ───────────────────────────────────────────────────
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const exam = await Exam.findByPk(id);

    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot update completed exam' });
    }
    if (req.user.role !== 1 && exam.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own exams.' });
    }

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

    const prevStart = exam.scheduled_start_at ? new Date(exam.scheduled_start_at).toISOString() : null;
    const prevEnd = exam.scheduled_end_at ? new Date(exam.scheduled_end_at).toISOString() : null;
    const scheduleChanged =
      (newStart && newStart !== prevStart) || (newEnd && newEnd !== prevEnd);

    await exam.update(updateData);

    if (scheduleChanged && newStart && newEnd) {
      notifyStudentsAboutExam(exam, true);
    }

    res.json({ message: 'Exam updated', exam });
  } catch (error) {
    console.error('updateExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /exam/:examId/status ─────────────────────────────────────────────────
// Safe polling endpoint — only returns exam status, never creates an attempt.
// Used by ExamInstructions waiting room instead of POST /exam/:id/start.
exports.getExamStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findByPk(examId, {
      attributes: ['id', 'status', 'start_time', 'duration_minutes'],
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ status: exam.status, start_time: exam.start_time });
  } catch (error) {
    console.error('getExamStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /teacher/exams/:id/image ────────────────────────────────────────────
exports.uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const imageUrl = `/public/uploads/${req.file.filename}`;
    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    console.error('uploadQuestionImage error:', error);
    res.status(500).json({ message: 'Server error uploading image' });
  }
};

// ─── POST /teacher/exams/:id/questions ───────────────────────────────────────
exports.addOrUpdateQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    await Question.destroy({ where: { exam_id: id } });

    const newQuestions = questions.map(q => ({
      exam_id: id,
      question_text: q.question_text,
      question_type: 'MCQ',
      options: q.options,
      correct_answer: q.correct_answer,
      marks: q.marks || 1,
      image_url: q.image_url || null,
    }));

    await Question.bulkCreate(newQuestions);
    res.json({ message: 'Questions saved successfully' });
  } catch (error) {
    console.error('addOrUpdateQuestions error:', error);
    res.status(500).json({ message: 'Server error adding questions' });
  }
};

// ─── POST /teacher/exams/:id/otp ─────────────────────────────────────────────
exports.generateExamOtp = async (req, res) => {
  try {
    const { id } = req.params;
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

// ─── POST /teacher/exams/:id/start ───────────────────────────────────────────
exports.startExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (exam.status !== 'Scheduled') {
      if (exam.status === 'Draft') {
        return res.status(400).json({ message: 'Cannot start a Draft exam. Generate an OTP first.' });
      }
      return res.status(400).json({ message: 'Exam already started or completed' });
    }

    const questionCount = await Question.count({ where: { exam_id: id } });
    if (questionCount === 0) {
      return res.status(400).json({ message: 'Cannot start exam: no questions have been added yet.' });
    }

    await exam.update({ status: 'Live', start_time: new Date() });

    const msToWait = exam.duration_minutes * 60000;
    setTimeout(async () => {
      try {
        const e = await Exam.findByPk(id);
        if (e && e.status === 'Live') {
          await e.update({ status: 'Completed', is_active: false });
          await ExamAttempt.update(
            { status: 'AUTO_SUBMITTED' },
            { where: { exam_id: id, status: { [Op.in]: ['WAITING_ROOM', 'IN_PROGRESS'] } } },
          );
        }
      } catch (timerErr) {
        console.error('Auto end error', timerErr);
      }
    }, msToWait);

    await ExamAttempt.update(
      { status: 'IN_PROGRESS', start_time: new Date(), end_time: new Date(Date.now() + msToWait) },
      { where: { exam_id: id, status: 'WAITING_ROOM' } },
    );

    res.json({ message: 'Exam started successfully' });
  } catch (error) {
    console.error('startExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /teacher/exams/:id/submissions ──────────────────────────────────────
exports.getExamSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await ExamAttempt.findAll({
      where: { exam_id: id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'full_name', 'unique_id', 'college_roll_number'] },
      ],
    });

    const stats = {
      total_students: attempts.length,
      appeared: attempts.length,
      average_score: attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
        : 0,
    };

    res.json({ attempts, stats });
  } catch (error) {
    console.error('getExamSubmissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /teacher/exams/:id/end ─────────────────────────────────────────────
exports.endExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.status === 'Completed') {
      return res.status(400).json({ message: 'Exam is already completed' });
    }

    await exam.update({ status: 'Completed', is_active: false });
    const [affectedCount] = await ExamAttempt.update(
      { status: 'FORCE_SUBMITTED' },
      { where: { exam_id: id, status: { [Op.in]: ['WAITING_ROOM', 'IN_PROGRESS'] } } },
    );

    res.json({ message: 'Exam force-ended successfully', affectedStudents: affectedCount });
  } catch (error) {
    console.error('endExam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE /teacher/exams/:id ────────────────────────────────────────────────
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (req.user.role !== 1 && exam.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own exams.' });
    }
    if (exam.status === 'Live' || exam.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot delete an exam that is currently live or already completed.' });
    }

    await exam.destroy();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('deleteExam error:', error);
    res.status(500).json({ message: 'Server error deleting exam' });
  }
};
// ─── GET /teacher/departments ────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const { role, id } = req.user; // We use 'id' instead of 'department_id'
    
    let whereClause = { status: 'ACTIVE' };

    // If it's a teacher, look up their fresh profile in the database
    if (role === 2 || role === '2') {
      const teacher = await User.findByPk(id, { attributes: ['department_id'] });
      
      // If they have a department assigned, lock it down!
      if (teacher && teacher.department_id) {
        whereClause.id = teacher.department_id;
      }
    }

    const departments = await Department.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'code']
    });
    
    res.json(departments);
  } catch (error) {
    console.error('getDepartments error:', error);
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};