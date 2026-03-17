// server/src/modules/attendance/attendanceController.js
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
  AttendanceSession,
  Attendance,
  User,
  Subject,
  Department,
} = require('../../models');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Generate random OTP of given digit length
const generateOTP = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

// Check if current time is within class window
const isWithinClassWindow = (session) => {
  const now = new Date();
  return now >= new Date(session.class_start_time) && now <= new Date(session.class_end_time);
};

// ── POST /api/attendance/sessions ────────────────────────────────────────────
// Teacher creates a new attendance session for a subject
// Body: { subject_id, class_start_time, class_end_time, mode, otp_digits, otp_expiry_minutes }
exports.createSession = async (req, res) => {
  try {
    const {
      subject_id,
      class_start_time,
      class_end_time,
      mode = 'OTP',
      otp_digits = 6,
      otp_expiry_minutes = 10,
    } = req.body;

    const teacherId = req.user.id;
    const deptId = req.user.department_id;

    if (!subject_id) return res.status(400).json({ message: 'subject_id is required.' });
    if (!class_start_time || !class_end_time) return res.status(400).json({ message: 'class_start_time and class_end_time are required.' });
    if (new Date(class_start_time) >= new Date(class_end_time)) return res.status(400).json({ message: 'Start time must be before end time.' });
    if (!['OTP', 'QR'].includes(mode)) return res.status(400).json({ message: 'mode must be OTP or QR.' });
    if (![4, 6].includes(Number(otp_digits))) return res.status(400).json({ message: 'otp_digits must be 4 or 6.' });

    // Verify subject belongs to teacher's department
    const subject = await Subject.findByPk(subject_id, {
      include: [{ model: Department, as: 'department' }],
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    if (subject.department_id !== deptId && req.user.role !== 1) {
      return res.status(403).json({ message: 'Subject does not belong to your department.' });
    }

    // Check no active session already exists for this subject today
    const today = new Date().toISOString().split('T')[0];
    const existing = await AttendanceSession.findOne({
      where: {
        subject_id,
        teacher_id: teacherId,
        is_active: true,
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
      subject_id,
      teacher_id: teacherId,
      department_id: deptId,
      semester: subject.semester,
      class_start_time: new Date(class_start_time),
      class_end_time: new Date(class_end_time),
      mode,
      otp_digits: Number(otp_digits),
      otp_expiry_minutes: Number(otp_expiry_minutes),
      is_active: true,
    });

    res.status(201).json({
      message: 'Attendance session created.',
      session: {
        id: session.id,
        subject: subject.name,
        mode: session.mode,
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

// ── POST /api/attendance/sessions/:id/activate ───────────────────────────────
// Teacher hits "Generate OTP/QR" button — only works within class window
// Returns the OTP code or QR token
exports.activateSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (!session.is_active) {
      return res.status(400).json({ message: 'Session is closed.' });
    }

    // ── CORE INTEGRITY CHECK ──────────────────────────────────────
    // Teacher can only generate OTP/QR within the class window
    if (!isWithinClassWindow(session)) {
      const now = new Date();
      const start = new Date(session.class_start_time);
      const end = new Date(session.class_end_time);
      if (now < start) {
        return res.status(400).json({
          message: `Class has not started yet. You can generate attendance from ${start.toLocaleTimeString()}.`,
        });
      }
      if (now > end) {
        return res.status(400).json({
          message: `Class window has ended (ended at ${end.toLocaleTimeString()}). Attendance cannot be taken.`,
        });
      }
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

    res.json({
      message: `${session.mode} generated successfully.`,
      session_id: session.id,
      activated_at: now,
      expires_at: expiresAt,
      otp_expiry_minutes: session.otp_expiry_minutes,
      ...responseData,
    });
  } catch (err) {
    console.error('activateSession error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /api/attendance/sessions/:id/regenerate ─────────────────────────────
// Teacher regenerates OTP/QR (e.g. if it expired mid-class)
// Only allowed within class window
exports.regenerateCode = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });
    if (!session.is_active) return res.status(400).json({ message: 'Session is closed.' });

    if (!isWithinClassWindow(session)) {
      return res.status(400).json({ message: 'Cannot regenerate outside class hours.' });
    }

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

    res.json({
      message: `${session.mode} regenerated.`,
      expires_at: expiresAt,
      ...responseData,
    });
  } catch (err) {
    console.error('regenerateCode error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── POST /api/attendance/sessions/:id/close ──────────────────────────────────
// Teacher manually closes session (auto-marks absent for enrolled students who didn't submit)
exports.closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subject' }],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });

    // Find students who should have attended (same program + semester)
    const eligibleStudents = await User.findAll({
      where: {
        role: 3,
        is_active: true,
        department_id: session.department_id,
        ...(session.subject?.program_id && { program_id: session.subject.program_id }),
        ...(session.semester && { current_semester: session.semester }),
      },
      attributes: ['id'],
    });

    // Find students who already marked attendance
    const alreadyMarked = await Attendance.findAll({
      where: { session_id: session.id },
      attributes: ['student_id'],
    });
    const markedIds = new Set(alreadyMarked.map(a => a.student_id));

    // Auto-mark ABSENT for those who didn't submit
    const absentStudents = eligibleStudents.filter(s => !markedIds.has(s.id));
    if (absentStudents.length > 0) {
      await Attendance.bulkCreate(
        absentStudents.map(s => ({
          student_id: s.id,
          subject_id: session.subject_id,
          teacher_id: session.teacher_id,
          session_id: session.id,
          date: new Date().toISOString().split('T')[0],
          status: 'ABSENT',
          semester: session.semester,
          verified: false,
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

// ── POST /api/attendance/submit ───────────────────────────────────────────────
// Student submits attendance
// Body: { session_id, code, latitude, longitude }
// code = OTP digits OR qr_token depending on mode
exports.submitAttendance = async (req, res) => {
  try {
    const { session_id, code, latitude, longitude } = req.body;
    const studentId = req.user.id;

    if (!session_id || !code) return res.status(400).json({ message: 'session_id and code are required.' });
    if (latitude === undefined || longitude === undefined) return res.status(400).json({ message: 'Location is required. Please enable GPS.' });

    const session = await AttendanceSession.findByPk(session_id, {
      include: [{ model: Department, as: 'department' }],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (!session.is_active) return res.status(400).json({ message: 'This attendance session is closed.' });

    // ── 1. CLASS WINDOW CHECK ─────────────────────────────────────
    if (!isWithinClassWindow(session)) {
      const now = new Date();
      if (now > new Date(session.class_end_time)) {
        return res.status(400).json({ message: 'Class session has ended. Attendance cannot be submitted.' });
      }
      return res.status(400).json({ message: 'Class has not started yet.' });
    }

    // ── 2. OTP/QR VALIDITY CHECK ──────────────────────────────────
    if (!session.activated_at) {
      return res.status(400).json({ message: 'Teacher has not activated attendance yet.' });
    }
    if (new Date() > new Date(session.expires_at)) {
      return res.status(400).json({ message: 'OTP has expired. Ask your teacher to regenerate.' });
    }

    // Verify the code
    if (session.mode === 'OTP') {
      if (session.otp_code !== String(code).trim()) {
        return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
      }
    } else {
      if (session.qr_token !== String(code).trim()) {
        return res.status(400).json({ message: 'Invalid QR code. Please scan again.' });
      }
    }

    // ── 3. GEOFENCE CHECK ─────────────────────────────────────────
    const dept = session.department;
    if (!dept?.latitude || !dept?.longitude) {
      return res.status(400).json({ message: 'Department location not configured. Contact admin.' });
    }

    const distanceMeters = getDistanceMeters(
      Number(latitude), Number(longitude),
      dept.latitude, dept.longitude
    );
    const radius = dept.geofence_radius || 50;

    if (distanceMeters > radius) {
      return res.status(400).json({
        message: `You are ${Math.round(distanceMeters)}m away from the classroom. Must be within ${radius}m.`,
        distance_meters: distanceMeters,
        required_meters: radius,
      });
    }

    // ── 4. DUPLICATE CHECK ────────────────────────────────────────
    const existing = await Attendance.findOne({
      where: { session_id, student_id: studentId },
    });
    if (existing) {
      if (existing.status === 'PRESENT') return res.status(400).json({ message: 'You have already marked attendance for this class.' });
      // Was auto-marked ABSENT before they submitted — update to PRESENT
      await existing.update({
        status: 'PRESENT',
        verified: true,
        face_confidence: null,
        distance_meters: distanceMeters,
      });
      return res.json({ message: 'Attendance marked successfully!', status: 'PRESENT', distance_meters: distanceMeters });
    }

    // ── 5. CREATE ATTENDANCE RECORD ───────────────────────────────
    await Attendance.create({
      student_id: studentId,
      subject_id: session.subject_id,
      teacher_id: session.teacher_id,
      session_id,
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
      semester: session.semester,
      verified: true,
      distance_meters: distanceMeters,
    });

    res.json({
      message: 'Attendance marked successfully!',
      status: 'PRESENT',
      distance_meters: Math.round(distanceMeters),
    });
  } catch (err) {
    console.error('submitAttendance error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/sessions/:id ─────────────────────────────────────────
// Teacher gets session status + live attendance list
exports.getSessionStatus = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'semester'] }],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.teacher_id !== req.user.id && req.user.role !== 1) return res.status(403).json({ message: 'Access denied.' });

    const records = await Attendance.findAll({
      where: { session_id: session.id },
      include: [{ model: User, attributes: ['id', 'full_name', 'college_roll_number'], as: undefined }],
      order: [['createdAt', 'ASC']],
    });

    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;

    const now = new Date();
    const withinWindow = isWithinClassWindow(session);
    const otpActive = session.expires_at && now < new Date(session.expires_at);

    res.json({
      session: {
        id: session.id,
        subject: session.subject,
        mode: session.mode,
        class_start_time: session.class_start_time,
        class_end_time: session.class_end_time,
        activated_at: session.activated_at,
        expires_at: session.expires_at,
        otp_expiry_minutes: session.otp_expiry_minutes,
        otp_digits: session.otp_digits,
        is_active: session.is_active,
        within_window: withinWindow,
        otp_active: otpActive,
        // Only include code if still active — don't expose expired codes
        ...(otpActive && session.mode === 'OTP' && { otp_code: session.otp_code }),
        ...(otpActive && session.mode === 'QR' && { qr_token: session.qr_token }),
      },
      summary: { present, absent, total: records.length },
      records: records.map(r => ({
        id: r.id,
        student_id: r.student_id,
        student_name: r.User?.full_name || 'Unknown',
        roll_number: r.User?.college_roll_number || 'N/A',
        status: r.status,
        verified: r.verified,
        distance_meters: r.distance_meters ? Math.round(r.distance_meters) : null,
        marked_at: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('getSessionStatus error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/sessions ─────────────────────────────────────────────
// Teacher gets their sessions (today or by date)
exports.getTeacherSessions = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const sessions = await AttendanceSession.findAll({
      where: {
        teacher_id: req.user.id,
        class_start_time: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'semester'] }],
      order: [['class_start_time', 'ASC']],
    });

    const sessionsWithCount = await Promise.all(sessions.map(async s => {
      const present = await Attendance.count({ where: { session_id: s.id, status: 'PRESENT' } });
      const total = await Attendance.count({ where: { session_id: s.id } });
      return {
        id: s.id,
        subject: s.subject,
        mode: s.mode,
        class_start_time: s.class_start_time,
        class_end_time: s.class_end_time,
        is_active: s.is_active,
        activated_at: s.activated_at,
        within_window: isWithinClassWindow(s),
        present_count: present,
        total_count: total,
      };
    }));

    res.json(sessionsWithCount);
  } catch (err) {
    console.error('getTeacherSessions error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/my ────────────────────────────────────────────────────
// Student views their own attendance records
// Query: ?subject_id=X or ?semester=X
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

    // Group by subject
    const bySubject = {};
    for (const r of records) {
      const key = r.subject_id || 'unknown';
      if (!bySubject[key]) {
        bySubject[key] = {
          subject_id: r.subject_id,
          subject_name: r.subject?.name || 'Unknown',
          subject_code: r.subject?.code || '',
          total: 0, present: 0, absent: 0, late: 0,
          records: [],
        };
      }
      bySubject[key].total++;
      if (r.status === 'PRESENT') bySubject[key].present++;
      else if (r.status === 'ABSENT') bySubject[key].absent++;
      else if (r.status === 'LATE') bySubject[key].late++;
      bySubject[key].records.push({
        id: r.id,
        date: r.date,
        status: r.status,
        verified: r.verified,
        class_time: r.session ? `${new Date(r.session.class_start_time).toLocaleTimeString()} - ${new Date(r.session.class_end_time).toLocaleTimeString()}` : null,
      });
    }

    // Add percentage
    const subjects = Object.values(bySubject).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    res.json({ subjects, total_records: records.length });
  } catch (err) {
    console.error('getMyAttendance error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── GET /api/attendance/sessions/:id/available ───────────────────────────────
// Student checks if a session is active and within window before submitting
exports.getSessionForStudent = async (req, res) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
      attributes: ['id', 'subject_id', 'mode', 'class_start_time', 'class_end_time', 'expires_at', 'activated_at', 'is_active', 'otp_digits'],
    });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const now = new Date();
    const withinWindow = isWithinClassWindow(session);
    const otpActive = session.expires_at && now < new Date(session.expires_at);

    res.json({
      id: session.id,
      subject: session.subject,
      mode: session.mode,
      otp_digits: session.otp_digits,
      class_start_time: session.class_start_time,
      class_end_time: session.class_end_time,
      is_active: session.is_active,
      within_window: withinWindow,
      otp_active: otpActive,
      activated: !!session.activated_at,
      expires_at: session.expires_at,
    });
  } catch (err) {
    console.error('getSessionForStudent error:', err);
    res.status(500).json({ message: err.message || 'Server error.' });
  }
};

// ── Haversine distance formula ────────────────────────────────────────────────
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) { return deg * (Math.PI / 180); }