// server/src/modules/teacher/teacherSubjectController.js
const { User, Subject, TeacherSubject, Department, Program } = require('../../models');
const { Op } = require('sequelize');

// ── GET /teacher/my-subjects ──────────────────────────────────────────────────
// Returns subjects this teacher has claimed, grouped by semester
exports.getMySubjects = async (req, res) => {
  try {
    const teacher = await User.findByPk(req.user.id, {
      attributes: ['id', 'department_id', 'full_name'],
    });
    if (!teacher?.department_id) {
      return res.status(400).json({ message: 'No department assigned to your account. Contact admin.' });
    }

    const claimed = await TeacherSubject.findAll({
      where: { teacher_id: req.user.id },
      include: [{
        model: Subject,
        as: 'subject',
        include: [{ model: Program, as: 'program', attributes: ['id', 'name', 'code'] }],
      }],
      order: [[{ model: Subject, as: 'subject' }, 'semester', 'ASC']],
    });

    res.json(claimed.map(c => ({
      id: c.subject.id,
      name: c.subject.name,
      code: c.subject.code,
      semester: c.subject.semester,
      category: c.subject.category,
      program: c.subject.program,
      claimed_at: c.claimed_at,
    })));
  } catch (err) {
    console.error('getMySubjects error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /teacher/available-subjects?semester=X ────────────────────────────────
// Returns all subjects in teacher's department, optionally filtered by semester
// Shows claim status for each
exports.getAvailableSubjects = async (req, res) => {
  try {
    const teacher = await User.findByPk(req.user.id, {
      attributes: ['id', 'department_id'],
    });
    if (!teacher?.department_id) {
      return res.status(400).json({ message: 'No department assigned. Contact admin.' });
    }

    const where = {
      department_id: teacher.department_id,
      is_active: true,
    };
    if (req.query.semester) where.semester = parseInt(req.query.semester);

    const subjects = await Subject.findAll({
      where,
      include: [
        { model: Program, as: 'program', attributes: ['id', 'name', 'code'] },
      ],
      order: [['semester', 'ASC'], ['name', 'ASC']],
    });

    // Find which ones this teacher has claimed
    const claimed = await TeacherSubject.findAll({
      where: { teacher_id: req.user.id },
      attributes: ['subject_id'],
    });
    const claimedIds = new Set(claimed.map(c => c.subject_id));

    res.json(subjects.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      semester: s.semester,
      category: s.category,
      program: s.program,
      is_claimed: claimedIds.has(s.id),
    })));
  } catch (err) {
    console.error('getAvailableSubjects error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /teacher/available-subjects/semesters ─────────────────────────────────
// Returns list of available semesters in teacher's department
exports.getAvailableSemesters = async (req, res) => {
  try {
    const teacher = await User.findByPk(req.user.id, { attributes: ['id', 'department_id'] });
    if (!teacher?.department_id) return res.status(400).json({ message: 'No department assigned.' });

    const subjects = await Subject.findAll({
      where: { department_id: teacher.department_id, is_active: true },
      attributes: ['semester'],
      group: ['semester'],
      order: [['semester', 'ASC']],
    });

    res.json(subjects.map(s => s.semester));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /teacher/my-subjects/claim ──────────────────────────────────────────
// Teacher claims a subject
exports.claimSubject = async (req, res) => {
  try {
    const { subject_id } = req.body;
    if (!subject_id) return res.status(400).json({ message: 'subject_id is required.' });

    const teacher = await User.findByPk(req.user.id, { attributes: ['id', 'department_id'] });
    if (!teacher?.department_id) return res.status(400).json({ message: 'No department assigned.' });

    // Verify subject belongs to teacher's dept
    const subject = await Subject.findOne({
      where: { id: subject_id, department_id: teacher.department_id },
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found in your department.' });

    const [record, created] = await TeacherSubject.findOrCreate({
      where: { teacher_id: req.user.id, subject_id },
      defaults: { teacher_id: req.user.id, subject_id },
    });

    if (!created) return res.status(409).json({ message: 'You have already claimed this subject.' });

    res.status(201).json({ message: `${subject.name} added to your subjects.`, subject_id });
  } catch (err) {
    console.error('claimSubject error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── DELETE /teacher/my-subjects/:subject_id ───────────────────────────────────
// Teacher unclaims a subject
exports.unclaimSubject = async (req, res) => {
  try {
    const deleted = await TeacherSubject.destroy({
      where: { teacher_id: req.user.id, subject_id: req.params.subject_id },
    });
    if (!deleted) return res.status(404).json({ message: 'Subject not found in your list.' });
    res.json({ message: 'Subject removed from your list.' });
  } catch (err) {
    console.error('unclaimSubject error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};