// server/src/modules/assignments/assignmentController.js
const { Assignment, AssignmentSubmission, User, Subject, StudentSubject } = require('../../models');
const { Op } = require('sequelize');

// --- Professional Database Integration ---
// No more in-memory mocks. Everything is stored in PostgreSQL.

// ── Teacher methods ─────────────────────────────────────────────────────────

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
    const { subject_id, title, description, due_date, max_marks } = req.body;
    const teacher_id = req.user.id;

    if (!subject_id || !title || !due_date) {
      return res.status(400).json({ message: 'Subject, title, and due date are required.' });
    }

    let file_url = null;
    if (req.file) {
      file_url = `uploads/submissions/${req.file.filename}`; 
    }

    const assignment = await Assignment.create({
      subject_id,
      teacher_id,
      title,
      description,
      due_date,
      max_marks,
      status: 'PUBLISHED',
      file_url
    });

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    console.error('createAssignment error:', error);
    res.status(500).json({ message: 'Server error while creating assignment.' });
  }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, max_marks, status } = req.body;
    const teacher_id = req.user.id;

    const assignment = await Assignment.findOne({ where: { id, teacher_id } });

    if (!assignment) return res.status(404).json({ message: 'Assignment not found or unauthorized.' });

    let file_url = assignment.file_url;
    if (req.file) {
      file_url = `uploads/submissions/${req.file.filename}`;
    }

    await assignment.update({ title, description, due_date, max_marks, status, file_url });
    res.json({ message: 'Assignment updated successfully', assignment });
  } catch (error) {
    console.error('updateAssignment error:', error);
    res.status(500).json({ message: 'Server error while updating assignment.' });
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher_id = req.user.id;

    const assignment = await Assignment.findOne({ where: { id, teacher_id } });

    if (!assignment) return res.status(404).json({ message: 'Assignment not found or unauthorized.' });

    await assignment.destroy();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('deleteAssignment error:', error);
    res.status(500).json({ message: 'Server error while deleting assignment.' });
  }
};

// Get all submissions for an assignment
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher_id = req.user.id;

    const assignment = await Assignment.findOne({ where: { id, teacher_id } });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found or unauthorized.' });

    const submissions = await AssignmentSubmission.findAll({
      where: { assignment_id: id },
      include: [{ model: User, as: 'student', attributes: ['full_name', 'username', 'email', 'college_roll_number', 'current_semester'] }],
      order: [['submitted_at', 'DESC']],
    });

    res.json(submissions);
  } catch (error) {
    console.error('getAssignmentSubmissions error:', error);
    res.status(500).json({ message: 'Server error while fetching submissions.' });
  }
};

// Grade a submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks_obtained, feedback } = req.body;
    const teacher_id = req.user.id;

    const submission = await AssignmentSubmission.findByPk(submissionId, {
      include: [{ model: Assignment, as: 'Assignment' }]
    });

    if (submission.status === 'GRADED') {
      return res.status(403).json({ message: 'This submission has already been graded and cannot be edited.' });
    }

    if (marks_obtained > submission.Assignment.max_marks) {
      return res.status(400).json({ message: `Marks obtained (${marks_obtained}) cannot exceed maximum marks (${submission.Assignment.max_marks}).` });
    }

    await submission.update({
      marks_obtained,
      feedback,
      status: 'GRADED',
    });

    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    console.error('gradeSubmission error:', error);
    res.status(500).json({ message: 'Server error while grading submission.' });
  }
};

// ── Shared methods ──────────────────────────────────────────────────────────

// List assignments for a subject
exports.getSubjectAssignments = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const assignments = await Assignment.findAll({
      where: { subject_id: subjectId },
      order: [['due_date', 'ASC']],
    });
    res.json(assignments);
  } catch (error) {
    console.error('getSubjectAssignments error:', error);
    res.status(500).json({ message: 'Server error while fetching assignments.' });
  }
};

// Get assignment details (with student submission if exists)
exports.getAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const assignment = await Assignment.findByPk(id, {
      include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }]
    });

    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    let submission = null;
    if (role === 3) { // Student
      submission = await AssignmentSubmission.findOne({
        where: { assignment_id: id, student_id: userId }
      });
    }

    res.json({ assignment, submission });
  } catch (error) {
    console.error('getAssignmentDetails error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching assignment details.',
      debug: error.message
    });
  }
};

// ── Student methods ─────────────────────────────────────────────────────────

// Submit an assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_content } = req.body;
    const student_id = req.user.id;
    const file = req.file;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    const existingSubmission = await AssignmentSubmission.findOne({
      where: { assignment_id: id, student_id }
    });

    if (existingSubmission && ['SUBMITTED', 'LATE', 'GRADED'].includes(existingSubmission.status)) {
      return res.status(403).json({ message: 'Assignment is already submitted and locked for editing.' });
    }

    // Handle file path
    let file_path = null;
    if (file) {
      file_path = `uploads/submissions/${file.filename}`;
    }

    const status = new Date() > new Date(assignment.due_date) ? 'LATE' : 'SUBMITTED';

    const submission = await AssignmentSubmission.create({
      assignment_id: id,
      student_id,
      submission_content,
      file_path,
      status,
      submitted_at: new Date(),
    });

    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('submitAssignment error:', error);
    res.status(500).json({ message: 'Server error while submitting assignment.' });
  }
};

// List assignments for the student (all enrolled subjects)
exports.getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    console.log(`[DEBUG] getMyAssignments called for user: ${userId}, role: ${role}`);

    let assignments;

    if (role == 2) { // Teacher
      assignments = await Assignment.findAll({
        where: { teacher_id: userId },
        include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
        order: [['due_date', 'ASC']],
      });
    } else { // Student
      // Fetch user to get their current department/program
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      // --- UNIFIED BCA VISIBILITY ---
      let assignmentsWhere = { 
        status: { [Op.ne]: 'DRAFT' } 
      };

      if (user.department_id) {
        // Find all subjects in the student's department
        const deptSubjects = await Subject.findAll({
          where: { department_id: user.department_id },
          attributes: ['id'],
          raw: true
        });
        const deptSubjectIds = deptSubjects.map(s => s.id);
        assignmentsWhere.subject_id = { [Op.in]: deptSubjectIds };
        console.log(`[DEBUG] Unified Mode: Showing all ${deptSubjectIds.length} subjects for Dept ${user.department_id}`);
      }

      assignments = await Assignment.findAll({
        where: assignmentsWhere,
        include: [
          { model: Subject, as: 'subject', attributes: ['name', 'code', 'semester'] },
          { 
            model: AssignmentSubmission, 
            as: 'AssignmentSubmissions',
            where: { student_id: userId },
            required: false 
          }
        ],
        order: [['due_date', 'ASC']],
      });
    }

    console.log(`[DEBUG] Found ${assignments.length} assignments for user.`);
    res.json(assignments);
  } catch (error) {
    console.error('getMyAssignments error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching assignments.',
      debug: error.message 
    });
  }
};
