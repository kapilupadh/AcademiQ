// server/src/modules/academic/academicController.js

const { Department, Program, Subject, sequelize } = require('../../models');

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
// ── REPLACE getMySubjects in server/src/modules/academic/academicController.js ──

exports.getMySubjects = async (req, res) => {
  try {
    const { Subject, User } = require('../../models');
    const { id: userId, role } = req.user;

    // Always fetch fresh user data from DB — don't rely on JWT for department_id
    const user = await User.findByPk(userId, {
      attributes: ['id', 'department_id', 'program_id', 'current_semester'],
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const where = { is_active: true };

    if (role === 2) {
      // Teacher — filter by their department
      if (!user.department_id) {
        return res.status(400).json({ message: 'Your account has no department assigned. Contact admin.' });
      }
      where.department_id = user.department_id;

    } else if (role === 3) {
      // Student — filter by program + current_semester
      if (!user.program_id) {
        return res.status(400).json({ message: 'Your account has no program assigned. Update your profile.' });
      }
      where.program_id = user.program_id;
      if (user.current_semester) where.semester = user.current_semester;
    }
    // Admin (role=1) — no filter, sees all

    let subjects = await Subject.findAll({
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

// POST /api/academics/subjects
// Allows teachers to quickly add a subject to their department
exports.createSubject = async (req, res) => {
  try {
    const { name, code, semester } = req.body;
    const { id: userId, role } = req.user;

    // Fetch fresh user data
    const { User } = require('../../models');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!name) return res.status(400).json({ message: 'Subject name is required.' });

    // For teachers, we automatically assign their department from DB
    const targetDeptId = role === 1 && req.body.department_id ? req.body.department_id : user.department_id;

    if (!targetDeptId) return res.status(400).json({ message: 'Department not assigned to your account.' });

    // Find the first program in that department to link the subject
    const { Program } = require('../../models');
    const program = await Program.findOne({ where: { department_id: targetDeptId } });

    const newSubject = await Subject.create({
      name,
      code: code || name.slice(0, 6).toUpperCase(),
      semester: semester || 1,
      department_id: targetDeptId,
      program_id: program ? program.id : null,
      teacher_id: role === 2 ? userId : null,
      is_active: true
    });

    res.status(201).json(newSubject);
  } catch (err) {
    console.error('createSubject error:', err);
    res.status(500).json({ message: 'Error creating subject' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    
    // Only teachers or admins should be able to delete subjects
    if (role !== 1 && role !== 2) {
      return res.status(403).json({ message: 'Unauthorized to delete subjects' });
    }

    const { Subject, Assignment } = require('../../models');
    
    // Check if the subject exists
    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Optional: Check if assignments depend on this subject and prevent deletion
    const assignmentsCount = await Assignment.count({ where: { subject_id: id } });
    if (assignmentsCount > 0) {
      return res.status(409).json({ message: `Cannot delete subject. There are ${assignmentsCount} assignment(s) linked to it.` });
    }

    await subject.destroy();
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('deleteSubject error:', err);
    res.status(500).json({ message: 'Error deleting subject' });
  }
};

// POST /api/academics/departments
// Admin role only
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const uppercaseCode = code ? code.trim().toUpperCase() : name.trim().slice(0, 4).toUpperCase();

    // Check unique name (case insensitive)
    const { Op } = require('sequelize');
    const existing = await Department.findOne({ 
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('name')), 
        sequelize.fn('lower', name.trim())
      )
    });
    if (existing) {
      return res.status(400).json({ message: 'A department with this name already exists.' });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: uppercaseCode,
      status: 'ACTIVE'
    });

    res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (err) {
    console.error('createDepartment error:', err);
    res.status(500).json({ message: 'Error creating department.' });
  }
};

// DELETE /api/academics/departments/:id
// Admin role only
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // Check if there are users (teachers/students) or programs assigned to this department
    const { User, Program } = require('../../models');
    
    const userCount = await User.count({ where: { department_id: id } });
    if (userCount > 0) {
      return res.status(400).json({ message: 'Cannot delete department. Active users (students/teachers) are currently assigned to it.' });
    }

    const programCount = await Program.count({ where: { department_id: id } });
    if (programCount > 0) {
      return res.status(400).json({ message: 'Cannot delete department. There are active programs linked to it.' });
    }

    await dept.destroy();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('deleteDepartment error:', err);
    res.status(500).json({ message: 'Error deleting department.' });
  }
};