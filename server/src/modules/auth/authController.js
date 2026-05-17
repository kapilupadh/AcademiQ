const User = require('../../models/User');
const UniqueId = require('../../models/UniqueId');
const RegistrationSession = require('../../models/RegistrationSession');
const { User: UserModel, Attendance, Subject, AttendanceSession, Exam } = require('../../models'); // For Dashboard
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../../utils/emailService');

// ── New: Get Student Dashboard Data ──────────────────────────────────────────
exports.getStudentDashboard = async (req, res) => {
  try {
    const { User, Attendance, Subject, Exam } = require('../../models');
    const { Op } = require('sequelize');
    const studentId = req.user.id;

    // 1. Fetch Student
    const studentRaw = await User.findByPk(studentId, { raw: true });
    if (!studentRaw) return res.status(404).json({ message: 'Student not found' });
    
    console.log('[DASHBOARD] Fetching data for:', studentRaw.full_name);

    // 2. Fetch All Attendance
    let allAttendance = [];
    try {
      allAttendance = await Attendance.findAll({
        where: { student_id: studentId },
        raw: true 
      }) || [];
    } catch (e) { console.error('Attendance fetch error:', e); }

    // 3. Process Subjects
    let subjects = [];
    let subjectAttendance = [];
    const subjectMap = {};
    try {
      const subjectIds = [...new Set(allAttendance.map(a => a.subject_id))].filter(Boolean);
      if (subjectIds.length > 0) {
        subjects = await Subject.findAll({
          where: { id: { [Op.in]: subjectIds } },
          raw: true
        }) || [];
        
        subjects.forEach(s => {
          subjectMap[s.id] = { name: s.name, code: s.code, total: 0, present: 0 };
        });

        allAttendance.forEach(a => {
          if (subjectMap[a.subject_id]) {
            subjectMap[a.subject_id].total++;
            if (a.status === 'PRESENT') subjectMap[a.subject_id].present++;
          }
        });

        subjectAttendance = Object.values(subjectMap).map(s => ({
          name: s.name || 'Unknown',
          code: s.code || 'N/A',
          percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        }));
      }
    } catch (e) { console.error('Subject processing error:', e); }

    // 4. Fetch Exams
    let finalExams = [];
    try {
      const upcomingExamsRaw = await Exam.findAll({
        where: {
          scheduled_start_at: { [Op.gt]: new Date() },
          [Op.or]: [
            { department_id: studentRaw.department_id || null },
            { department_id: null }
          ]
        },
        order: [['scheduled_start_at', 'ASC']],
        limit: 5,
        raw: true
      }) || [];

      finalExams = upcomingExamsRaw.length > 0 ? upcomingExamsRaw : [
        {
          id: 'demo-1',
          title: 'Welcome to BCA',
          type: 'ORIENTATION',
          scheduled_start_at: new Date(new Date().getTime() + 86400000),
          duration_minutes: 60
        }
      ];
    } catch (e) { console.error('Exam fetch error:', e); }

    // 5. Build Response
    const responseData = {
      student: {
        full_name: studentRaw.full_name || 'User',
        current_semester: studentRaw.current_semester || 1,
      },
      stats: {
        overall_attendance: allAttendance.length > 0 ? Math.round((allAttendance.filter(a => a.status === 'PRESENT').length / allAttendance.length) * 100) : 0,
        total_classes: allAttendance.length,
        present_count: allAttendance.filter(a => a.status === 'PRESENT').length,
        subjects_count: subjects.length,
        upcoming_exams_count: finalExams.length,
      },
      subject_attendance: subjectAttendance,
      recent_attendance: (allAttendance || []).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(a => ({
        id: a.id,
        date: a.date,
        status: a.status,
        subject_name: subjectMap[a.subject_id]?.name || "General Class",
        verified: !!a.verified
      })),
      upcoming_exams: finalExams.map(e => ({
        id: e.id,
        title: e.title,
        type: e.type,
        scheduled_start_at: e.scheduled_start_at,
        duration_minutes: e.duration_minutes,
      })),
    };

    res.json(responseData);
  } catch (err) {
    console.error('CRITICAL DASHBOARD ERROR:', err);
    res.status(500).json({ message: 'Error syncing dashboard data.', error: err.message });
  }
};
// ── Admin Registration ──────────────────────────────────────────────────────
exports.adminRegister = async (req, res) => {
  try {
    const { full_name, username, email, password, admin_code } = req.body;
    const expectedCode = process.env.ADMIN_SETUP_CODE;
    if (!expectedCode) {
      console.error('ADMIN_SETUP_CODE is not configured');
      return res.status(500).json({ message: 'Admin registration is not configured.' });
    }
    if (!admin_code || admin_code !== expectedCode) {
      return res.status(403).json({ message: 'Invalid admin setup code.' });
    }
    if (await User.findOne({ where: { email } })) return res.status(400).json({ message: 'Email already registered.' });
    if (await User.findOne({ where: { username } })) return res.status(400).json({ message: 'Username already taken.' });

    const syntheticId = `ADMIN-${uuidv4().slice(0, 8).toUpperCase()}`;
    await UniqueId.create({
      unique_id: syntheticId,
      role: 1,
      student_name: full_name,
      student_email: email,
      is_used: true,
      status: 'ACTIVE',
      used_date: new Date(),
    });

    const password_hash = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      full_name, username, email, password_hash, role: 1, is_active: true, email_verified: true, unique_id: syntheticId,
    });
    res.status(201).json({ message: 'Admin account created successfully.', adminId: newAdmin.id });
  } catch (error) {
    console.error('adminRegister error:', error);
    res.status(500).json({ message: error.message || 'Server error.' });
  }
};

// ── Identity & Validation ────────────────────────────────────────────────────
exports.validateId = async (req, res) => {
  try {
    const { unique_id } = req.body;
    const idRecord = await UniqueId.findOne({ where: { unique_id } });
    if (!idRecord) return res.status(404).json({ message: 'Invalid Unique ID' });
    if (idRecord.status !== 'ACTIVE') return res.status(400).json({ message: 'Unique ID is INACTIVE' });
    if (idRecord.is_used) return res.status(400).json({ message: 'Unique ID already used' });
    if (idRecord.expiry_date && new Date() > new Date(idRecord.expiry_date)) return res.status(400).json({ message: 'Unique ID expired' });

    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await RegistrationSession.create({ 
      unique_id, 
      session_token: sessionToken, 
      expires_at: expiresAt, 
      status: 'PENDING' 
    });
    res.json({ 
      valid: true, 
      session_token: sessionToken, 
      role: idRecord.role, 
      bound_data: { name: idRecord.student_name, email: idRecord.student_email } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Validation Error' });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    res.json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── Core Auth Flow ──────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { unique_id, session_token, username, email, password, full_name, dob, department_id, program_id, current_semester, phone_number } = req.body;

    // MANDATORY FIELD VALIDATION
    if (!username || !email || !password || !full_name || !dob || !phone_number) {
      return res.status(400).json({ message: 'All fields are compulsory including phone number.' });
    }

    // PHONE NUMBER VALIDATION
    if (!/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    const session = await RegistrationSession.findOne({ where: { session_token, unique_id, status: 'PENDING', expires_at: { [Op.gt]: new Date() } } });
    if (!session) return res.status(400).json({ message: 'Invalid or Expired Session.' });

    const idRecord = await UniqueId.findOne({ where: { unique_id } });
    if (!idRecord || idRecord.is_used) return res.status(400).json({ message: 'Unique ID invalid or used.' });

    // STRICT TEACHER VALIDATION
    if (idRecord.role === 2) {
      const inputEmail = email.trim().toLowerCase();
      const boundEmail = (idRecord.student_email || '').trim().toLowerCase();
      if (inputEmail !== boundEmail) {
        return res.status(400).json({ message: 'Registration Failed: Email must match the one provided by Admin.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const t = await sequelize.transaction();
    try {
      const newUser = await User.create({
        unique_id, 
        username, 
        email, 
        password_hash: hashedPassword, 
        full_name, 
        dob, 
        phone_number,
        role: idRecord.role,
        is_active: true, 
        department_id: department_id || null, 
        program_id: program_id || null,
        current_semester: current_semester ? parseInt(current_semester) : null, 
        registered_date: new Date(),
        email_verified: true
      }, { transaction: t });
      await idRecord.update({ is_used: true, used_date: new Date() }, { transaction: t });
      await session.update({ status: 'COMPLETED' }, { transaction: t });
      await t.commit();
      res.status(201).json({ message: 'Registration successful. Please login.', userId: newUser.id });
    } catch (dbError) {
      await t.rollback();
      throw dbError;
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration Failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { login_id, password, expected_role } = req.body;

    // ── Check Hardcoded Admin ───────────────────────────────────────────
    const adminId = process.env.ADMIN_ID || 'ADMIN-DU-001';
    const adminPass = process.env.ADMIN_PASSWORD || 'AcademiQ@DU2026';

    if (login_id === adminId && password === adminPass) {
      if (expected_role && parseInt(expected_role) !== 1) {
        return res.status(403).json({ message: 'Access denied: Incorrect portal.' });
      }

      const token = jwt.sign(
        { id: 'SYSTEM-ADMIN', role: 1, department_id: null, program_id: null },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful',
        user: { id: 'SYSTEM-ADMIN', username: 'admin', email: 'admin@academiq.com', role: 1, full_name: 'System Admin' },
        token,
        role: 1
      });
    }

    // ── Standard User Login ─────────────────────────────────────────────
    const user = await User.findOne({ where: { unique_id: login_id } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.is_active) return res.status(403).json({ message: 'Account is inactive.' });
    if (expected_role && Number(user.role) !== Number(expected_role)) {
      return res.status(403).json({ message: 'Access denied: Incorrect portal.' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        department_id: user.department_id || null,
        program_id: user.program_id || null 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful', 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        full_name: user.full_name,
        department_id: user.department_id || null,
        program_id: user.program_id || null,
        current_semester: user.current_semester || null,
        college_roll_number: user.college_roll_number || null
      }, 
      token, 
      role: user.role 
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── Password & Profile Management ────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json({ message: 'Email not found.' });
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    await user.update({ otp: hashedOTP, otp_expires_at: new Date(Date.now() + 2 * 60 * 1000) });
    const emailResult = await sendOTP(req.body.email, otp);
    emailResult.success ? res.json({ message: 'OTP sent.' }) : res.status(500).json({ message: 'Failed to send email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.otp || new Date() > new Date(user.otp_expires_at) || !(await bcrypt.compare(otp, user.otp))) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    const resetToken = jwt.sign({ id: user.id, email: user.email, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    res.json({ message: 'OTP verified.', resetToken, unique_id: user.unique_id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password_reset') return res.status(400).json({ message: 'Invalid token.' });
    const user = await User.findByPk(decoded.id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashedPassword, otp: null, otp_expires_at: null });
    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { Department, Program } = require('../../models');
    const user = await User.findByPk(req.user.id, { 
      attributes: { exclude: ['password_hash', 'otp', 'otp_expires_at'] },
      include: [
        { model: Department, as: 'department', attributes: ['name', 'code'] },
        { model: Program, as: 'program', attributes: ['name', 'code'] }
      ]
    });
    user ? res.json(user) : res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('getProfile Error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, dob, current_semester, program_id, department_id, phone_number } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate phone number if provided
    if (phone_number && !/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    const isStudent = user.role === 3;
    const isTeacher = user.role === 2;
    Object.assign(user, { 
      full_name: isStudent ? user.full_name : full_name, 
      dob: (dob && dob !== "") ? dob : null, 
      current_semester: current_semester ? parseInt(current_semester) : null, 
      program_id: program_id || null, 
      department_id: (isStudent || isTeacher) ? user.department_id : (department_id || null),
      phone_number: phone_number || user.phone_number
    });
    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) return res.status(400).json({ message: 'Incorrect current password' });
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password' });
  }
};