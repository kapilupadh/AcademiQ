// server/src/modules/admin/dashboardController.js
const { sequelize, User, Attendance, Exam, ExamAttempt, ActivityLog, UniqueId, Department, Violation } = require('../../models');
const { Op } = require('sequelize');

// ── Existing endpoints (kept as-is) ──────────────────────────────────────────

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 3 } });
    const activeTeachers = await User.count({ where: { role: 2, is_active: true } });
    const currentExams = await Exam.count({ where: { is_active: true } });
    const lowAttendanceCount = 0;

    const avgScoreResult = await ExamAttempt.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
      where: { status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED'] } }
    });
    const avgSessionalMarks = avgScoreResult?.get('avgScore')
      ? parseFloat(avgScoreResult.get('avgScore')).toFixed(1)
      : 0;

    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.count({ where: { date: today, status: 'PRESENT' } });
    const attendancePercentage = totalStudents > 0
      ? ((presentToday / totalStudents) * 100).toFixed(1)
      : 0;

    res.json({ totalStudents, activeTeachers, currentExams, lowAttendanceCount, avgSessionalMarks, attendancePercentage });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

exports.getSessionalTrends = async (req, res) => {
  try {
    const data = [
      { semester: 'Sem 1', avgMarks: 0 }, { semester: 'Sem 2', avgMarks: 0 },
      { semester: 'Sem 3', avgMarks: 0 }, { semester: 'Sem 4', avgMarks: 0 },
      { semester: 'Sem 5', avgMarks: 0 }, { semester: 'Sem 6', avgMarks: 0 },
    ];
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends' });
  }
};

exports.getAttendanceHeatmap = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const heatmapData = await Attendance.findAll({
      attributes: ['date', [sequelize.fn('COUNT', sequelize.col('id')), 'present_count']],
      where: { date: { [Op.between]: [startDate, endDate] }, status: 'PRESENT' },
      group: ['date'],
      order: [['date', 'ASC']]
    });

    const totalStudents = await User.count({ where: { role: 3 } });
    const formatted = heatmapData.map(d => ({
      date: d.date,
      count: totalStudents > 0
        ? Math.round((parseInt(d.get('present_count')) / totalStudents) * 100)
        : 0
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching heatmap' });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['full_name', 'role'] }]
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

// ── NEW: Full Dashboard Overview (single call for AdminDashboard.jsx) ─────────

exports.getDashboardOverview = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // ── Parallel KPI fetches ──────────────────────────────────────────────────
    const [
      totalStudents, activeTeachers, currentExams,
      avgScoreResult, presentToday, totalViolations
    ] = await Promise.all([
      User.count({ where: { role: 3 } }),
      User.count({ where: { role: 2, is_active: true } }),
      Exam.count({ where: { status: { [Op.in]: ['Scheduled', 'Live'] } } }),
      ExamAttempt.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
        where: { status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED'] } }
      }),
      Attendance.count({ where: { date: today, status: 'PRESENT' } }),
      Violation.count()
    ]);

    const avgSessionalMarks = avgScoreResult?.get('avgScore')
      ? parseFloat(avgScoreResult.get('avgScore')).toFixed(1)
      : 0;
    const attendancePercentage = totalStudents > 0
      ? ((presentToday / totalStudents) * 100).toFixed(1)
      : 0;

    // ── Upcoming Exams ────────────────────────────────────────────────────────
    const upcomingExamsDb = await Exam.findAll({
      where: { status: { [Op.in]: ['Scheduled', 'Live'] } },
      order: [
        [sequelize.literal(`CASE WHEN "scheduled_start_at" IS NULL THEN 1 ELSE 0 END`), 'ASC'],
        ['scheduled_start_at', 'ASC'],
        ['createdAt', 'ASC']
      ],
      limit: 5,
      attributes: ['id', 'title', 'subject', 'status', 'scheduled_start_at']
    });

    const upcomingExams = upcomingExamsDb.map(exam => {
      const dt = exam.scheduled_start_at ? new Date(exam.scheduled_start_at) : null;
      return {
        name: exam.title,
        subject: exam.subject || 'General',
        date: dt ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD',
        time: dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
        status: exam.status
      };
    });

    // ── Department Distribution ───────────────────────────────────────────────
    const DEPT_COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6','#84cc16'];
    const departments = await Department.findAll({
      attributes: [
        'id', 'name',
        [
          sequelize.literal(`(SELECT COUNT(*) FROM "Users" WHERE "Users"."department_id" = "Department"."id" AND "Users"."role" = 3)`),
          'studentCount'
        ]
      ],
      order: [[sequelize.literal('"studentCount"'), 'DESC']],
      limit: 8
    });

    const departmentDistribution = departments
      .map((dept, i) => ({
        name: dept.name,
        studentCount: parseInt(dept.getDataValue('studentCount')) || 0,
        color: DEPT_COLORS[i % DEPT_COLORS.length]
      }))
      .filter(d => d.studentCount > 0);

    // ── Top Students (by avg exam score) ─────────────────────────────────────
    const topAttemptsRaw = await ExamAttempt.findAll({
      where: { status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED'] } },
      attributes: [
        'student_id',
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
      ],
      group: ['student_id'],
      order: [[sequelize.fn('AVG', sequelize.col('score')), 'DESC']],
      limit: 5
    });

    const studentIds = topAttemptsRaw.map(t => t.student_id).filter(Boolean);
    const studentsForTop = studentIds.length > 0
      ? await User.findAll({
          where: { id: { [Op.in]: studentIds } },
          attributes: ['id', 'full_name', 'department_id'],
          include: [{ model: Department, attributes: ['name'], required: false }]
        })
      : [];

    const studentMap = {};
    studentsForTop.forEach(s => { studentMap[s.id] = s; });

    const topStudents = topAttemptsRaw.map((attempt, i) => {
      const student = studentMap[attempt.student_id];
      return {
        rank: i + 1,
        name: student?.full_name || 'Unknown',
        department: student?.Department?.name || 'Unknown Dept',
        avgScore: Math.round(parseFloat(attempt.getDataValue('avgScore')) || 0)
      };
    });

    // ── Enrollment Trend (last 6 months) ─────────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const enrollmentRaw = await User.findAll({
      where: { role: 3, createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'newCount']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']]
    });

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Build a map of month → newCount
    const monthMap = {};
    enrollmentRaw.forEach(row => {
      const d = new Date(row.getDataValue('month'));
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthMap[key] = parseInt(row.getDataValue('newCount')) || 0;
    });

    // Build rolling total
    let runningTotal = totalStudents;
    const enrollmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const newEnrollments = monthMap[key] || 0;
      enrollmentTrend.push({
        month: MONTH_NAMES[d.getMonth()],
        newEnrollments,
        totalActive: runningTotal
      });
    }

    // ── Attendance Trend (last 7 days) ────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const attendanceRaw = await Attendance.findAll({
      attributes: ['date', [sequelize.fn('COUNT', sequelize.col('id')), 'presentCount']],
      where: {
        date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] },
        status: 'PRESENT'
      },
      group: ['date'],
      order: [['date', 'ASC']]
    });

    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const attendanceByDate = {};
    attendanceRaw.forEach(row => {
      attendanceByDate[row.date] = parseInt(row.getDataValue('presentCount')) || 0;
    });

    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const presentCount = attendanceByDate[dateStr] || 0;
      const pct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      attendanceTrend.push({
        day: DAY_NAMES[d.getDay()],
        studentAttendance: pct,
        teacherAttendance: 0, // attendance module for teachers not yet active
        overall: pct
      });
    }

    // ── Exam Performance (avg score per exam) ────────────────────────────────
    const examPerfRaw = await ExamAttempt.findAll({
      where: { status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED'] } },
      attributes: [
        'exam_id',
        [sequelize.fn('AVG', sequelize.col('ExamAttempt.score')), 'avgScore']
      ],
      group: ['exam_id', 'Exam.id'],
      order: [['exam_id', 'ASC']],
      limit: 6,
      include: [{ model: Exam, attributes: ['title'], required: false }]
    });

    const examPerformance = examPerfRaw.map(row => ({
      examName: (row.Exam?.title || 'Exam').substring(0, 14),
      averageScore: Math.round(parseFloat(row.getDataValue('avgScore')) || 0)
    }));

    // ── Recent Activities ─────────────────────────────────────────────────────
    const activityLogs = await ActivityLog.findAll({
      limit: 15,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['full_name', 'role'], required: false }]
    });

    const ROLE_MAP = { 1: 'Admin', 2: 'Teacher', 3: 'Student' };
    const DOT_COLORS = ['bg-violet-500','bg-emerald-500','bg-amber-500','bg-blue-500','bg-rose-500'];
    const recentActivity = activityLogs.map((log, i) => ({
      id: log.id,
      action: log.action || log.description || 'System activity logged',
      role: ROLE_MAP[log.User?.role] || 'System',
      timestamp: new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
                 ' · ' + new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      dotColor: DOT_COLORS[i % DOT_COLORS.length]
    }));

    // ── Final response ────────────────────────────────────────────────────────
    res.json({
      stats: {
        totalStudents,
        activeTeachers,
        currentExams,
        avgSessionalMarks,
        attendancePercentage,
        totalViolations
      },
      upcomingExams,
      departmentDistribution,
      topStudents,
      enrollmentTrend,
      attendanceTrend,
      examPerformance,
      recentActivity
    });

  } catch (error) {
    console.error('getDashboardOverview error:', error);
    res.status(500).json({ message: 'Error fetching dashboard overview' });
  }
};