// server/src/modules/teacher/dashboardController.js
const {
  sequelize, User, Exam, ExamAttempt, TeacherSubject, Subject
} = require('../../models');  // ← Subject is NOW imported here
const { Op, QueryTypes } = require('sequelize');

exports.getDashboardOverview = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // ── Teacher Info ──────────────────────────────────────────────────────────
    const teacher = await User.findByPk(teacherId, {
      attributes: ['id', 'full_name', 'email']
    });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // ── Assigned Subjects (no include, just count subject_ids) ────────────────
    const assignedSubjectsCount = await TeacherSubject.count({
      where: { teacher_id: teacherId }
    });

    // ── Core Stats (parallel) ─────────────────────────────────────────────────
    const submittedStatuses = ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED'];

    const [
      totalExams,
      completedExams,
      upcomingExamsCount,
      pendingReviews,
      passCountResult,
      totalScoredResult
    ] = await Promise.all([

      Exam.count({ where: { created_by: teacherId } }),

      Exam.count({ where: { created_by: teacherId, status: 'Completed' } }),

      Exam.count({
        where: { created_by: teacherId, status: { [Op.in]: ['Scheduled', 'Live'] } }
      }),

      ExamAttempt.count({
        where: { status: { [Op.in]: submittedStatuses } },
        include: [{
          model: Exam,
          where: { created_by: teacherId },
          attributes: [],
          required: true
        }]
      }),

      ExamAttempt.count({
        where: { status: { [Op.in]: submittedStatuses }, score: { [Op.gte]: 40 } },
        include: [{
          model: Exam,
          where: { created_by: teacherId },
          attributes: [],
          required: true
        }]
      }),

      ExamAttempt.count({
        where: { status: { [Op.in]: submittedStatuses }, score: { [Op.not]: null } },
        include: [{
          model: Exam,
          where: { created_by: teacherId },
          attributes: [],
          required: true
        }]
      })
    ]);

    // ── Avg Score — use raw query to avoid GROUP BY conflict ──────────────────
    const avgScoreResult = await sequelize.query(
      `SELECT AVG(ea.score) AS "avgScore"
       FROM exam_attempts ea
       INNER JOIN exams e ON ea.exam_id = e.id
       WHERE ea.status IN ('SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED')
         AND e.created_by = :teacherId
         AND ea.score IS NOT NULL`,
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    const avgScore = avgScoreResult[0]?.avgScore
      ? parseFloat(avgScoreResult[0].avgScore).toFixed(1)
      : null;

    const passRate = totalScoredResult > 0
      ? parseFloat(((passCountResult / totalScoredResult) * 100).toFixed(1))
      : null;

    // ── Subject-wise Avg Score — raw query (avoids GROUP BY issues) ───────────
    const subjectStatsRaw = await sequelize.query(
      `SELECT e.subject AS "subjectName", ROUND(AVG(ea.score)::numeric, 1) AS "avg_score"
       FROM exam_attempts ea
       INNER JOIN exams e ON ea.exam_id = e.id
       WHERE ea.status IN ('SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED')
         AND e.created_by = :teacherId
         AND ea.score IS NOT NULL
       GROUP BY e.subject
       ORDER BY AVG(ea.score) DESC`,
      { replacements: { teacherId }, type: QueryTypes.SELECT }
    );

    const subject_stats = subjectStatsRaw.map(row => ({
      name: row.subjectName || 'Unknown',
      code: (row.subjectName || 'UNK').substring(0, 6).toUpperCase(),
      avg_score: Math.round(parseFloat(row.avg_score) || 0)
    }));

    // ── Upcoming Exams ────────────────────────────────────────────────────────
    const upcomingExamsDb = await Exam.findAll({
      where: {
        created_by: teacherId,
        status: { [Op.in]: ['Scheduled', 'Live'] }
      },
      order: [
        [sequelize.literal(`CASE WHEN "scheduled_start_at" IS NULL THEN 1 ELSE 0 END`), 'ASC'],
        ['scheduled_start_at', 'ASC']
      ],
      limit: 10,
      attributes: ['id', 'title', 'type', 'duration_minutes', 'scheduled_start_at', 'status']
    });

    const upcoming_exams = upcomingExamsDb.map(exam => ({
      id: exam.id,
      title: exam.title,
      type: exam.type || 'MCQ',
      duration_minutes: exam.duration_minutes,
      scheduled_start_at: exam.scheduled_start_at,
      status: exam.status
    }));

    // ── Recent Submissions ────────────────────────────────────────────────────
    const recentAttemptsDb = await ExamAttempt.findAll({
      where: { status: { [Op.in]: submittedStatuses } },
      include: [
        {
          model: Exam,
          where: { created_by: teacherId },
          attributes: ['title'],
          required: true
        },
        {
          model: User,
          as: 'student',           // ← correct alias from index.js
          attributes: ['full_name'],
          required: false
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    const recent_submissions = recentAttemptsDb.map(attempt => ({
      id: attempt.id,
      student_name: attempt.student?.full_name || 'Unknown',
      exam_title: attempt.Exam?.title || 'Unknown Exam',
      score: attempt.score !== null ? Math.round(attempt.score) : null
    }));

    // ── Final Response ────────────────────────────────────────────────────────
    res.json({
      teacher: { full_name: teacher.full_name, email: teacher.email },
      stats: {
        totalStudents: 0,
        assignedSubjects: assignedSubjectsCount,
        totalExams,
        completedExams,
        pendingReviews,
        upcomingExams: upcomingExamsCount,
        avgScore: avgScore ? parseFloat(avgScore) : null,
        passRate
      },
      subject_stats,
      upcoming_exams,
      recent_submissions
    });

  } catch (error) {
    console.error('Teacher getDashboardOverview error:', error);
    res.status(500).json({ message: 'Error fetching teacher dashboard data' });
  }
};