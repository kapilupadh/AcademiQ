// server/src/modules/academic/academicController.js

const { Department, Program, Subject } = require('../../models');

// GET /api/academics/departments
// All roles
exports.getDepartments = async (req, res) => {
  try {
    const depts = await Department.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']],
    });
    res.json(depts);
  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

// GET /api/academics/departments/:id/programs
// All roles
exports.getProgramsByDepartment = async (req, res) => {
  try {
    const programs = await Program.findAll({
      where: { department_id: req.params.id, is_active: true },
      attributes: ['id', 'name', 'code', 'duration_years'],
      order: [['name', 'ASC']],
    });
    res.json(programs);
  } catch (err) {
    console.error('getProgramsByDepartment error:', err);
    res.status(500).json({ message: 'Error fetching programs' });
  }
};

// GET /api/academics/programs/:id/subjects?semester=X
// Optional ?semester=X filter. All roles.
exports.getSubjectsByProgram = async (req, res) => {
  try {
    const where = { program_id: req.params.id, is_active: true };
    if (req.query.semester) {
      where.semester = parseInt(req.query.semester);
    }
    const subjects = await Subject.findAll({
      where,
      attributes: ['id', 'name', 'code', 'category', 'semester'],
      order: [['semester', 'ASC'], ['name', 'ASC']],
    });
    res.json(subjects);
  } catch (err) {
    console.error('getSubjectsByProgram error:', err);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

// GET /api/academics/my-subjects
// Smart filter based on role:
//   Teacher (role=2) → subjects in their department
//   Student (role=3) → subjects in their program + current_semester
//   Admin  (role=1) → all subjects
exports.getMySubjects = async (req, res) => {
  try {
    const { department_id, id: userId, role } = req.user;
    console.log('[DEBUG] getMySubjects called for user:', { userId, role, department_id });

    // Database-driven subject filtering
    const where = { is_active: true };

    if (role === 2) {
      if (!department_id)
        return res.status(400).json({ message: 'Your account has no department assigned.' });
      where.department_id = department_id;

    } else if (role === 3) {
      const { User } = require('../../models');
      const student = await User.findByPk(userId, {
        attributes: ['department_id'],
      });
      if (student?.department_id) where.department_id = student.department_id;
    }

    const subjects = await Subject.findAll({
      where,
      attributes: ['id', 'name', 'code', 'semester', 'department_id'],
      order: [['semester', 'ASC'], ['name', 'ASC']],
    });

    res.json(subjects);
  } catch (err) {
    console.error('getMySubjects error:', err);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};