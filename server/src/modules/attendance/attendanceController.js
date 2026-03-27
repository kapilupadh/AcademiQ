// server/src/modules/attendance/attendanceController.js
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  AttendanceSession, Attendance, User, Subject, Department,
} = require('../../models');

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateOTP = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const isWithinClassWindow = (session) => {
  const now = new Date();
  return now >= new Date(session.class_start_time) && now <= new Date(session.class_end_time);
};

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
const toRad = (d) => d * Math.PI / 180;

exports.createSession = async (req, res) => {
  try {
    const {
      subject_id, class_start_time, class_end_time,
      mode = 'OTP', otp_digits = 6, otp_expiry_minutes = 10,
    } = req.body;

    const teacherId = req.user.id;

    if (!subject_id) return res.status(400).json({ message: 'subject_id is required.' });
    if (!class_start_time || !class_end_time) return res.status(400).json({ message: 'class_start_time and class_end_time are required.' });
    if (new Date(class_start_time) >= new Date(class_end_time)) return res.status(400).json({ message: 'Start time must be before end time.' });
    if (!['OTP', 'QR'].includes(mode)) return res.status(400).json({ message: 'mode must be OTP or QR.' });
    if (![4, 6].includes(Number(otp_digits))) return res.status(400).json({ message: 'otp_digits must be 4 or 6.' });

    // ── FIXED: always fetch teacher from DB for accurate department_id ────────
    const teacher = await User.findByPk(teacherId, {
      attributes: ['id', 'department_id'],
    });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    const deptId = teacher.department_id;
    if (!deptId) return res.status(400).json({ message: 'Your account has no department assigned. Contact admin.' });

    const subject = await Subject.findByPk(subject_id, {
      include: [{ model: Department, as: 'department' }],
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    if (subject.department_id !== deptId && req.user.role !== 1) {
      return res.status(403).json({ message: 'Subject does not belong to your department.' });
    }

    // Check no duplicate active session for this subject today
    const today = new Date().toISOString().split('T')[0];
    const existing = await AttendanceSession.findOne({
      where: {
        subject_id, teacher_id: teacherId, is_active: true,
        class_start_time: { [Op.gte]: new Date(today) },
      },
    });
    if (existing) {
      return res.status(409).json({
        message: 'An active session already exists for this subject today.',
        session_id: existing.id,
      });
    }

    const session = await AttendanceSession.create({
      subject_id, teacher_id: teacherId, department_id: deptId,
      semester: subject.semester,
      class_start_time: new Date(class_start_time),
      class_end_time: new Date(class_end_time),
      mode, otp_digits: Number(otp_digits),
      otp_expiry_minutes: Number(otp_expiry_minutes),
      is_active: true,
    });

    res.status(201).json({
      message: 'Attendance session created.',
      session: {
        id: session.id, subject: subject.name, mode: session.mode,
        class_start_time: session.class_start_time,
        class_end_time: session.class_end_time,
        otp_digits: session.otp_digits,
        otp_expiry_minutes: session.otp_expiry_minutes,
        is_active: session.is_active,
      },
    });
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /api/attendance/sessions/:id/activate ────────────────────────────────
exports.activateSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });
    if (!session.is_active) return res.status(400).json({ message: 'Session is closed.' });

    if (!isWithinClassWindow(session)) {
      const now = new Date();
      const start = new Date(session.class_start_time);
      const end = new Date(session.class_end_time);
      if (now < start) return res.status(400).json({ message: `Class hasn't started yet. Available from ${start.toLocaleTimeString()}.` });
      if (now > end) return res.status(400).json({ message: `Class window ended at ${end.toLocaleTimeString()}.` });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + session.otp_expiry_minutes * 60 * 1000);
    let updateData = { activated_at: now, expires_at: expiresAt };
    let responseData = {};

    if (session.mode === 'OTP') {
      const otp = generateOTP(session.otp_digits);
      updateData.otp_code = otp;
      responseData = { mode: 'OTP', otp_code: otp, expires_at: expiresAt, otp_digits: session.otp_digits };
    } else {
      const qrToken = uuidv4();
      updateData.qr_token = qrToken;
      responseData = { mode: 'QR', qr_token: qrToken, expires_at: expiresAt };
    }

    await session.update(updateData);
    res.json({ message: `${session.mode} generated.`, session_id: session.id, activated_at: now, expires_at: expiresAt, otp_expiry_minutes: session.otp_expiry_minutes, ...responseData });
  } catch (err) {
    console.error('activateSession error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /api/attendance/sessions/:id/regenerate ──────────────────────────────
exports.regenerateCode = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });
    if (!session.is_active) return res.status(400).json({ message: 'Session is closed.' });
    if (!isWithinClassWindow(session)) return res.status(400).json({ message: 'Cannot regenerate outside class hours.' });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + session.otp_expiry_minutes * 60 * 1000);
    let updateData = { activated_at: now, expires_at: expiresAt };
    let responseData = {};

    if (session.mode === 'OTP') {
      const otp = generateOTP(session.otp_digits);
      updateData.otp_code = otp;
      responseData = { otp_code: otp };
    } else {
      const qrToken = uuidv4();
      updateData.qr_token = qrToken;
      responseData = { qr_token: qrToken };
    }

    await session.update(updateData);
    res.json({ message: `${session.mode} regenerated.`, expires_at: expiresAt, ...responseData });
  } catch (err) {
    console.error('regenerateCode error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /api/attendance/sessions/:id/close ───────────────────────────────────
exports.closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subject' }],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });

    const eligibleStudents = await User.findAll({
      where: {
        role: 3, is_active: true,
        department_id: session.department_id,
        ...(session.subject?.program_id && { program_id: session.subject.program_id }),
        ...(session.semester && { current_semester: session.semester }),
      },
      attributes: ['id'],
    });

    const alreadyMarked = await Attendance.findAll({ where: { session_id: session.id }, attributes: ['student_id'] });
    const markedIds = new Set(alreadyMarked.map(a => a.student_id));
    const absentStudents = eligibleStudents.filter(s => !markedIds.has(s.id));

    if (absentStudents.length > 0) {
      await Attendance.bulkCreate(
        absentStudents.map(s => ({
          student_id: s.id, subject_id: session.subject_id,
          teacher_id: session.teacher_id, session_id: session.id,
          date: new Date().toISOString().split('T')[0],
          status: 'ABSENT', semester: session.semester, verified: false,
        })),
        { ignoreDuplicates: true }
      );
    }

    await session.update({ is_active: false, otp_code: null, qr_token: null });

    res.json({
      message: 'Session closed.',
      present_count: markedIds.size,
      absent_count: absentStudents.length,
      total_eligible: eligibleStudents.length,
    });
  } catch (err) {
    console.error('closeSession error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/active-sessions ───────────────────────────────────────
// NEW — Student calls this to see active sessions for their subjects
// Filters by student's department_id + program_id + current_semester
exports.getActiveSessionsForStudent = async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id, {
      attributes: ['id', 'department_id', 'program_id', 'current_semester'],
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const now = new Date();

    // Find active sessions within class window that match student's academic profile
    const sessions = await AttendanceSession.findAll({
      where: {
        is_active: true,
        class_start_time: { [Op.lte]: now },
        class_end_time: { [Op.gte]: now },
        // Match student's department
        ...(student.department_id && { department_id: student.department_id }),
        // Match student's semester
        ...(student.current_semester && { semester: student.current_semester }),
      },
      include: [
        {
          model: Subject, as: 'subject',
          attributes: ['id', 'name', 'code', 'semester'],
          // Only include subjects from student's program
          ...(student.program_id && {
            where: { program_id: student.program_id },
            required: true,
          }),
        },
        {
          model: User, as: 'teacher',
          attributes: ['id', 'full_name'],
        },
        {
          model: Department, as: 'department',
          attributes: ['id', 'name', 'latitude', 'longitude', 'geofence_radius'],
        },
      ],
      order: [['class_start_time', 'ASC']],
    });

    // For each session, check if student already marked attendance
    const result = await Promise.all(sessions.map(async (s) => {
      const existing = await Attendance.findOne({
        where: { session_id: s.id, student_id: req.user.id },
      });

      const otpActive = s.expires_at && now < new Date(s.expires_at);

      // Build allowed location from department data for client
      const allowedLocation = (s.department && s.department.latitude && s.department.longitude) ? {
        latitude: s.department.latitude,
        longitude: s.department.longitude,
        radius_meters: s.department.geofence_radius || 50,
      } : null;
      
      // Check if department has location configured
      const hasLocationConfigured = !!(s.department && s.department.latitude && s.department.longitude);

      return {
        id: s.id,
        subject: s.subject,
        teacher_name: s.teacher?.full_name || 'Unknown',
        mode: s.mode,
        otp_digits: s.otp_digits,
        class_start_time: s.class_start_time,
        class_end_time: s.class_end_time,
        is_active: s.is_active, // Session is open for attendance
        activated: !!s.activated_at, // OTP has been generated
        otp_active: otpActive, // OTP has not expired
        expires_at: s.expires_at,
        already_marked: !!existing,
        already_marked_status: existing?.status || null,
        department_location: s.department?.name || null,
        allowed_location: allowedLocation,
        location_configured: hasLocationConfigured,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('getActiveSessionsForStudent error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /api/attendance/submit ───────────────────────────────────────────────
exports.submitAttendance = async (req, res) => {
  try {
    // Support both JSON and multipart form data
    const { session_id, code, latitude, longitude } = req.body;
    const imageFile = req.file; // From multer middleware
    const studentId = req.user.id;

    if (!session_id || !code) return res.status(400).json({ message: 'session_id and code are required.' });
    if (latitude === undefined || longitude === undefined) return res.status(400).json({ message: 'Location is required. Please enable GPS.' });

    const session = await AttendanceSession.findByPk(session_id, {
      include: [{ model: Department, as: 'department' }],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (!session.is_active) return res.status(400).json({ message: 'This attendance session is closed.' });

    // 1. Class window check
    if (!isWithinClassWindow(session)) {
      const now = new Date();
      if (now > new Date(session.class_end_time)) return res.status(400).json({ message: 'Class session has ended.' });
      return res.status(400).json({ message: 'Class has not started yet.' });
    }

    // 2. OTP/QR validity
    if (!session.activated_at) return res.status(400).json({ message: 'Teacher has not activated attendance yet.' });
    if (new Date() > new Date(session.expires_at)) return res.status(400).json({ message: 'OTP has expired. Ask your teacher to regenerate.' });

    if (session.mode === 'OTP') {
      if (session.otp_code !== String(code).trim()) return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    } else {
      if (session.qr_token !== String(code).trim()) return res.status(400).json({ message: 'Invalid QR code. Please scan again.' });
    }

    // 3. Geofence check
    const dept = session.department;
    if (!dept?.latitude || !dept?.longitude) return res.status(400).json({ message: 'Department location not configured. Contact admin.' });

    const distanceMeters = getDistanceMeters(Number(latitude), Number(longitude), dept.latitude, dept.longitude);
    const radius = dept.geofence_radius || 50;

    if (distanceMeters > radius) {
      return res.status(400).json({
        message: `You are ${Math.round(distanceMeters)}m away from the classroom. Must be within ${radius}m.`,
        distance_meters: distanceMeters, required_meters: radius,
      });
    }

    // 4. Image validation (REQUIRED)
    // Validate that a file was uploaded
    if (!imageFile) {
      return res.status(400).json({ 
        message: 'Selfie photo is required to complete attendance. Please capture and upload your photo.' 
      });
    }
    
    // Additional server-side validation of the uploaded file
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validImageTypes.includes(imageFile.mimetype)) {
      // Clean up invalid file asynchronously
      const fs = require('fs').promises;
      fs.unlink(imageFile.path).catch(err => {
        console.error('Failed to cleanup invalid file:', err);
      });
      return res.status(400).json({ 
        message: 'Invalid image format. Only JPEG and PNG images are allowed.' 
      });
    }
    
    // Store the image path for serving
    const selfieUrl = `/uploads/attendance/${imageFile.filename}`;

    // 5. Use findOrCreate to prevent race conditions
    // If record exists, update it; otherwise create new one
    const [existing, created] = await Attendance.findOrCreate({
      where: { session_id, student_id: studentId },
      defaults: {
        student_id: studentId,
        subject_id: session.subject_id,
        teacher_id: session.teacher_id,
        session_id,
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        semester: session.semester,
        verified: true,
        distance_meters: distanceMeters,
        selfie_url: selfieUrl,
      },
    });

    // If record already existed, handle update or reject
    if (!created) {
      if (existing.status === 'PRESENT') {
        return res.status(400).json({ message: 'You have already marked attendance for this class.' });
      }
      await existing.update({
        status: 'PRESENT',
        verified: true,
        distance_meters: distanceMeters,
        selfie_url: selfieUrl,
      });
      return res.json({ message: 'Attendance marked successfully!', status: 'PRESENT', distance_meters: Math.round(distanceMeters), selfie_url: selfieUrl });
    }

    res.json({ message: 'Attendance marked successfully!', status: 'PRESENT', distance_meters: Math.round(distanceMeters), selfie_url: selfieUrl });
  } catch (err) {
    console.error('submitAttendance error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/sessions/:id ─────────────────────────────────────────
exports.getSessionStatus = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'semester'] }],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });

    const records = await Attendance.findAll({
      where: { session_id: session.id },
      include: [{ model: User, attributes: ['id', 'full_name', 'college_roll_number'] }],
      order: [['createdAt', 'ASC']],
    });

    const now = new Date();
    const otpActive = session.expires_at && now < new Date(session.expires_at);

    res.json({
      session: {
        id: session.id, subject: session.subject, mode: session.mode,
        class_start_time: session.class_start_time, class_end_time: session.class_end_time,
        activated_at: session.activated_at, expires_at: session.expires_at,
        otp_expiry_minutes: session.otp_expiry_minutes, otp_digits: session.otp_digits,
        is_active: session.is_active, within_window: isWithinClassWindow(session),
        otp_active: otpActive, activated: !!session.activated_at,
        ...(otpActive && session.mode === 'OTP' && { otp_code: session.otp_code }),
        ...(otpActive && session.mode === 'QR' && { qr_token: session.qr_token }),
      },
      summary: {
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        total: records.length,
      },
      records: records.map(r => ({
        id: r.id, student_id: r.student_id,
        student_name: r.User?.full_name || 'Unknown',
        roll_number: r.User?.college_roll_number || 'N/A',
        status: r.status, verified: r.verified,
        distance_meters: r.distance_meters ? Math.round(r.distance_meters) : null,
        marked_at: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('getSessionStatus error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/sessions ──────────────────────────────────────────────
exports.getTeacherSessions = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

    const sessions = await AttendanceSession.findAll({
      where: {
        teacher_id: req.user.id,
        class_start_time: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'semester'] }],
      order: [['class_start_time', 'ASC']],
    });

    const result = await Promise.all(sessions.map(async s => {
      const present = await Attendance.count({ where: { session_id: s.id, status: 'PRESENT' } });
      const total = await Attendance.count({ where: { session_id: s.id } });
      return {
        id: s.id, subject: s.subject, mode: s.mode,
        class_start_time: s.class_start_time, class_end_time: s.class_end_time,
        is_active: s.is_active, activated_at: s.activated_at,
        within_window: isWithinClassWindow(s),
        present_count: present, total_count: total,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('getTeacherSessions error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/my ────────────────────────────────────────────────────
exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const where = { student_id: studentId };
    if (req.query.subject_id) where.subject_id = req.query.subject_id;
    if (req.query.semester) where.semester = parseInt(req.query.semester);

    const records = await Attendance.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        { model: AttendanceSession, as: 'session', attributes: ['class_start_time', 'class_end_time', 'mode'] },
      ],
      order: [['date', 'DESC']],
    });

    const bySubject = {};
    for (const r of records) {
      const key = r.subject_id || 'unknown';
      if (!bySubject[key]) {
        bySubject[key] = {
          subject_id: r.subject_id, subject_name: r.subject?.name || 'Unknown',
          subject_code: r.subject?.code || '', total: 0, present: 0, absent: 0, late: 0, records: [],
        };
      }
      bySubject[key].total++;
      if (r.status === 'PRESENT') bySubject[key].present++;
      else if (r.status === 'ABSENT') bySubject[key].absent++;
      else if (r.status === 'LATE') bySubject[key].late++;
      bySubject[key].records.push({
        id: r.id, date: r.date, status: r.status, verified: r.verified,
        class_time: r.session
          ? `${new Date(r.session.class_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(r.session.class_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : null,
      });
    }

    const subjects = Object.values(bySubject).map(s => ({
      ...s, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    res.json({ subjects, total_records: records.length });
  } catch (err) {
    console.error('getMyAttendance error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/sessions/:id/available ────────────────────────────────
exports.getSessionForStudent = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
      attributes: ['id', 'subject_id', 'mode', 'class_start_time', 'class_end_time', 'expires_at', 'activated_at', 'is_active', 'otp_digits'],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const now = new Date();
    res.json({
      id: session.id, subject: session.subject, mode: session.mode,
      otp_digits: session.otp_digits,
      class_start_time: session.class_start_time, class_end_time: session.class_end_time,
      is_active: session.is_active,
      within_window: isWithinClassWindow(session),
      otp_active: session.expires_at && now < new Date(session.expires_at),
      activated: !!session.activated_at, expires_at: session.expires_at,
    });
  } catch (err) {
    console.error('getSessionForStudent error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/report ────────────────────────────────────────────────
// Admin report — filter by department, subject, date range, student
// Query params: department_id, subject_id, program_id, semester, from_date, to_date, student_id
exports.getAttendanceReport = async (req, res) => {
  try {
    const { department_id, subject_id, program_id, semester, from_date, to_date, student_id } = req.query;

    const attendanceWhere = {};
    if (subject_id) attendanceWhere.subject_id = subject_id;
    if (semester) attendanceWhere.semester = parseInt(semester);
    if (student_id) attendanceWhere.student_id = student_id;
    if (from_date || to_date) {
      attendanceWhere.date = {};
      if (from_date) attendanceWhere.date[Op.gte] = from_date;
      if (to_date) attendanceWhere.date[Op.lte] = to_date;
    }

    const subjectWhere = {};
    if (department_id) subjectWhere.department_id = department_id;
    if (program_id) subjectWhere.program_id = program_id;

    const records = await Attendance.findAll({
      where: attendanceWhere,
      include: [
        {
          model: Subject, as: 'subject',
          attributes: ['id', 'name', 'code', 'semester'],
          where: Object.keys(subjectWhere).length ? subjectWhere : undefined,
          required: Object.keys(subjectWhere).length > 0,
        },
        {
          model: User,
          attributes: ['id', 'full_name', 'college_roll_number', 'department_id'],
          where: department_id ? { department_id } : undefined,
          required: !!department_id,
        },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 500,
    });

    // Summary stats
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const verified = records.filter(r => r.verified).length;

    // Group by student for per-student summary
    const byStudent = {};
    for (const r of records) {
      const sid = r.student_id;
      if (!byStudent[sid]) {
        byStudent[sid] = {
          student_id: sid,
          student_name: r.User?.full_name || 'Unknown',
          roll_number: r.User?.college_roll_number || 'N/A',
          total: 0, present: 0, absent: 0,
        };
      }
      byStudent[sid].total++;
      if (r.status === 'PRESENT') byStudent[sid].present++;
      else if (r.status === 'ABSENT') byStudent[sid].absent++;
    }

    const studentSummaries = Object.values(byStudent).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    res.json({
      summary: { total, present, absent, verified, attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0 },
      student_summaries: studentSummaries,
      records: records.map(r => ({
        id: r.id,
        date: r.date,
        student_name: r.User?.full_name || 'Unknown',
        roll_number: r.User?.college_roll_number || 'N/A',
        subject_name: r.subject?.name || 'Unknown',
        subject_code: r.subject?.code || '',
        semester: r.semester,
        status: r.status,
        verified: r.verified,
        distance_meters: r.distance_meters ? Math.round(r.distance_meters) : null,
        marked_at: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('getAttendanceReport error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};