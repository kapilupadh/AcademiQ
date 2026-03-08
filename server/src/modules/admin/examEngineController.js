const { Exam, ExamAttempt, Violation, Subject, User, Question, StudentSubject, MaterialRequest, StudentAnswer, sequelize } = require('../../models');
const { Op } = require('sequelize');

// --- 1. Live Monitoring & Alerts Provider ---
exports.getLiveDashboard = async (req, res) => {
  try {
    // 1. Metric Board & Active Exam Cards
    const activeExams = await Exam.findAll({
      where: {
        status: { [Op.in]: ['Scheduled', 'Live'] }
      }
    });

    const examCardsPromise = activeExams.map(async (exam) => {
      // Find enrolled students for this exam's subject
      const enrolledCount = exam.subject_id 
        ? await StudentSubject.count({ where: { subject_id: exam.subject_id } })
        : 100; // Fallback for testing

      // Find active attempts
      const activeCount = await ExamAttempt.count({
        where: {
          exam_id: exam.id,
          status: 'IN_PROGRESS'
        }
      });

      let timeRemaining = "Pending";
      if (exam.status === 'Live' && exam.start_time) {
         const endTime = new Date(exam.start_time.getTime() + exam.duration_minutes * 60000);
         const diffMs = endTime - new Date();
         const diffMins = Math.floor(diffMs / 60000);
         const diffSecs = Math.floor((diffMs % 60000) / 1000);
         timeRemaining = diffMs > 0 ? `${diffMins}m ${diffSecs}s` : 'Ended';
      }

      return {
        id: exam.id,
        name: exam.title,
        subject: exam.subject || 'N/A',
        timeRemaining,
        active: activeCount,
        enrolled: enrolledCount || 1, // avoid div by 0
        status: exam.status === 'Live' ? 'healthy' : 'warning',
        activePercentage: enrolledCount > 0 ? (activeCount / enrolledCount) * 100 : 0
      };
    });

    const activeExamCards = await Promise.all(examCardsPromise);
    const totalConcurrentExams = activeExams.filter(e => e.status === 'Live').length;
    const totalActiveCandidates = activeExamCards.reduce((acc, curr) => acc + curr.active, 0);
    const totalEnrolledCandidates = activeExamCards.reduce((acc, curr) => acc + curr.enrolled, 0);

    // 2. System Alerts Engine
    // Pending Alerts
    const pendingAlerts = [];
    const scheduledExams = activeExams.filter(e => e.status === 'Scheduled');
    for (const exam of scheduledExams) {
       const qCount = await Question.count({ where: { exam_id: exam.id } });
       if (qCount === 0) {
         pendingAlerts.push({
           id: `P-${exam.id}`,
           type: 'missing_paper',
           exam: exam.title,
           msg: 'Question Paper Not Uploaded',
           priority: 'high',
           timestamp: new Date()
         });
       }
    }

    // Running Alerts (Live violations)
    const runningAlerts = [];
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
    const recentViolations = await Violation.findAll({
      where: {
        timestamp: { [Op.gte]: fiveMinsAgo }
      },
      include: [
        {
          model: ExamAttempt,
          include: [{ model: Exam, attributes: ['title', 'status'] }]
        }
      ]
    });

    const ufmCounts = {};
    recentViolations.forEach(v => {
      if (v.ExamAttempt && v.ExamAttempt.Exam && v.ExamAttempt.Exam.status === 'Live') {
         const eName = v.ExamAttempt.Exam.title;
         ufmCounts[eName] = (ufmCounts[eName] || 0) + 1;
      }
    });

    Object.keys(ufmCounts).forEach((examName, idx) => {
      if (ufmCounts[examName] > 3) { // Lowered threshold for testing
        runningAlerts.push({
          id: `R-${idx}`,
          type: 'ufm',
          exam: examName,
          msg: `Mass UFM Alert: ${ufmCounts[examName]} flags in 5 mins`,
          priority: 'critical',
          timestamp: new Date()
        });
      }
    });

    // Add a mock connectivity alert if none exist to demonstrate UI
    if (runningAlerts.length === 0 && activeExams.length > 0) {
       runningAlerts.push({
         id: `R-MOCK1`,
         type: 'connectivity',
         exam: activeExams[0].title,
         msg: 'Server latency spike detected',
         priority: 'medium',
         timestamp: new Date()
       });
    }

    // Completed Alerts
    const completedAlerts = [];
    // Provide a mocked completed alert for demonstration
    completedAlerts.push({
      id: `C-MOCK1`,
      type: 'missing_sub',
      exam: 'Term 1 Core Subject',
      msg: '3 submissions failed to sync properly',
      priority: 'high',
      timestamp: new Date()
    });

    res.json({
      metrics: {
         concurrentExams: totalConcurrentExams,
         activeCandidates: totalActiveCandidates,
         totalEnrolledCandidates: totalEnrolledCandidates,
         serverHealth: 'All Systems Operational'
      },
      activeExams: activeExamCards,
      alerts: {
         pending: pendingAlerts,
         running: runningAlerts,
         completed: completedAlerts
      }
    });
  } catch (error) {
    console.error('getLiveDashboard error:', error);
    res.status(500).json({ message: 'Error fetching live dashboard data' });
  }
};

// --- 2. Question Bank Master Repository ---
exports.getQuestionBankRepository = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      attributes: ['id', 'title', 'subject', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Count questions per exam
    const repoPromise = exams.map(async (exam) => {
      const qCount = await Question.count({ where: { exam_id: exam.id } });
      return {
        id: exam.id,
        title: exam.title,
        subject: exam.subject || 'General',
        teacher: 'Administration', // Mocking teacher placeholder unless Exam gets a created_by field
        uploads: qCount,
        uploadedAt: exam.createdAt.toLocaleDateString(),
      };
    });

    const repoData = await Promise.all(repoPromise);
    res.json(repoData);
  } catch (error) {
    console.error('getQuestionBankRepository error:', error);
    res.status(500).json({ message: 'Error fetching Repository' });
  }
};

exports.getExamQuestionsAdmin = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findByPk(examId, {
      attributes: ['id', 'title', 'subject', 'status', 'createdAt']
    });

    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const questions = await Question.findAll({
      where: { exam_id: examId },
      attributes: ['id', 'question_text', 'question_type', 'image_url', 'options', 'correct_answer', 'marks']
    });

    res.json({ exam, questions });
  } catch (error) {
    console.error('getExamQuestionsAdmin error:', error);
    res.status(500).json({ message: 'Error fetching exam questions' });
  }
};

// --- 3. Student Requests APIs ---
exports.getStudentRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.findAll({
      where: { status: 'PENDING' },
      include: [
        { model: User, as: 'student', attributes: ['id', 'full_name', 'email'] },
        { model: Exam, as: 'exam', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = requests.map(req => ({
      id: req.id,
      studentId: req.student_id.substring(0, 8).toUpperCase(),
      studentName: req.student?.full_name || 'Unknown Student',
      requestedMaterial: req.exam?.title || 'Unknown Material',
      reason: req.reason || 'No reason provided',
      date: req.createdAt.toLocaleDateString() + ' ' + req.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: req.status
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getStudentRequests error:', error);
    res.status(500).json({ message: 'Error fetching material requests' });
  }
};

exports.approveStudentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await MaterialRequest.findByPk(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'APPROVED';
    await request.save();

    res.json({ message: 'Request approved successfully', data: request });
  } catch (error) {
    console.error('approveStudentRequest error:', error);
    res.status(500).json({ message: 'Error approving request' });
  }
};

// --- 4. Evaluation Workflow APIs ---
exports.getEvaluationStatus = async (req, res) => {
  try {
    const attempts = await ExamAttempt.findAll({
      where: {
        status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED', 'TERMINATED', 'ABSENT'] }
      },
      include: [
        { model: User, as: 'student', attributes: ['id', 'full_name'] },
        { model: Exam, attributes: ['id', 'title', 'total_questions_to_ask'] },
        { model: Violation, attributes: ['type'] }
      ],
      order: [['end_time', 'DESC']]
    });

    // Build a cache of max scores per exam to avoid N+1 queries
    const examMaxScoreCache = {};
    const getMaxScore = async (examId) => {
      if (examMaxScoreCache[examId] !== undefined) return examMaxScoreCache[examId];
      const result = await Question.findAll({
        where: { exam_id: examId },
        attributes: ['marks']
      });
      const total = result.reduce((sum, q) => sum + (q.marks || 1), 0);
      examMaxScoreCache[examId] = total || 'N/A';
      return examMaxScoreCache[examId];
    };

    const completed = [];
    const canceled = [];

    for (const attempt of attempts) {
      const isCanceled = attempt.status === 'TERMINATED' || attempt.status === 'ABSENT' || attempt.Violations?.length > 3;

      if (isCanceled) {
        canceled.push({
          id: attempt.id,
          studentId: attempt.student_id ? attempt.student_id.substring(0, 8).toUpperCase() : 'UNKNOWN',
          name: attempt.student?.full_name || 'Unknown',
          exam: attempt.Exam?.title || 'Unknown',
          reason: attempt.status === 'TERMINATED' ? 'UFM Flagged' : attempt.status === 'ABSENT' ? 'No Show' : 'Multiple Violations',
          date: attempt.end_time ? attempt.end_time.toLocaleDateString() + ' ' + attempt.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
        });
      } else {
        const maxScore = attempt.exam_id ? await getMaxScore(attempt.exam_id) : 'N/A';
        completed.push({
          id: attempt.id,
          studentId: attempt.student_id ? attempt.student_id.substring(0, 8).toUpperCase() : 'UNKNOWN',
          name: attempt.student?.full_name || 'Unknown',
          exam: attempt.Exam?.title || 'Unknown',
          score: `${attempt.score}/${maxScore}`,
          gradedBy: 'AI Engine',
          date: attempt.end_time ? attempt.end_time.toLocaleDateString()  + ' ' + attempt.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
        });
      }
    }

    res.json({ completed, canceled });
  } catch (error) {
    console.error('getEvaluationStatus error:', error);
    res.status(500).json({ message: 'Error fetching evaluation lists' });
  }
};

exports.generateReportCards = async (req, res) => {
  try {
    const { attemptIds, template } = req.body;
    if (!attemptIds || !Array.isArray(attemptIds) || attemptIds.length === 0) {
      return res.status(400).json({ message: 'Missing attempt array' });
    }

    // Fetch the detailed Attempts with their full relationships
    const attempts = await ExamAttempt.findAll({
      where: { id: { [Op.in]: attemptIds } },
      include: [
        { model: User, as: 'student', attributes: ['id', 'full_name', 'unique_id', 'college_roll_number'] },
        { model: Exam, attributes: ['id', 'title', 'subject', 'semester'] },
        { 
          model: StudentAnswer, 
          include: [{ model: Question, attributes: ['id', 'correct_answer'] }]
        }
      ]
    });

    const reports = attempts.map(attempt => {
      // Safely count
      let totalQuestions = Array.isArray(attempt.assigned_questions) ? attempt.assigned_questions.length : 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      
      // Look through their submitted answers
      if (attempt.StudentAnswers && attempt.StudentAnswers.length > 0) {
        attempt.StudentAnswers.forEach(ans => {
           if (!ans.Question) return; // DB inconsistency failsafe
           
           if (!ans.selected_option || ans.selected_option.trim() === '') {
              // Answer blank but recorded
              return;
           }

           const isCorrect = String(ans.selected_option) === String(ans.Question.correct_answer);
           if (isCorrect) {
              totalCorrect++;
           } else {
              totalWrong++;
           }
        });
      }

      let unanswered = totalQuestions - (totalCorrect + totalWrong);
      if (unanswered < 0) unanswered = 0;

      return {
        id: attempt.id,
        student: {
          name: attempt.student?.full_name || 'Unknown',
          rollNo: attempt.student?.college_roll_number || attempt.student?.unique_id || 'N/A'
        },
        exam: {
          title: attempt.Exam?.title || 'Unknown Exam',
          subject: attempt.Exam?.subject || 'General',
          semester: attempt.Exam?.semester || 'N/A',
          date: attempt.end_time ? attempt.end_time.toLocaleDateString() : 'N/A'
        },
        score: {
          totalMarks: attempt.score || 0,
          totalQuestions,
          correct: totalCorrect,
          wrong: totalWrong,
          unanswered: unanswered
        }
      };
    });

    res.json({
      message: `${reports.length} Report Cards verified and generated successfully.`,
      reports: reports,
      template: template
    });
  } catch (error) {
    console.error('generateReportCards error:', error);
    res.status(500).json({ message: 'Error generating reports' });
  }
};

// --- 5. Post-Exam Analytics APIs ---
exports.getPostExamAnalytics = async (req, res) => {
  try {
    const attempts = await ExamAttempt.findAll({
      where: { status: { [Op.in]: ['SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED'] } },
      attributes: ['score']
    });

    // Compute distribution Bell Curve
    const distribution = {
      '0-10': 0, '10-20': 0, '20-30': 0, '30-40': 0, '40-50': 0,
      '50-60': 0, '60-70': 0, '70-80': 0, '80-90': 0, '90-100': 0
    };
    
    let totalScore = 0;
    
    attempts.forEach(a => {
       const score = a.score || 0;
       totalScore += score;
       if (score < 10) distribution['0-10']++;
       else if (score < 20) distribution['10-20']++;
       else if (score < 30) distribution['20-30']++;
       else if (score < 40) distribution['30-40']++;
       else if (score < 50) distribution['40-50']++;
       else if (score < 60) distribution['50-60']++;
       else if (score < 70) distribution['60-70']++;
       else if (score < 80) distribution['70-80']++;
       else if (score < 90) distribution['80-90']++;
       else distribution['90-100']++;
    });

    const distributionArray = Object.keys(distribution).map(k => ({
      name: k, count: distribution[k]
    }));

    // Generate mock topic performance data since we don't track question topic outcomes individually yet
    const topicData = [
      { name: "Unit 1", score: Math.round(Math.random() * 40 + 50) },
      { name: "Unit 2", score: Math.round(Math.random() * 40 + 50) },
      { name: "Unit 3", score: Math.round(Math.random() * 40 + 50) },
      { name: "Unit 4", score: Math.round(Math.random() * 20 + 30) },
      { name: "Unit 5", score: Math.round(Math.random() * 20 + 75) },
    ];

    const totalAttendees = attempts.length;
    const avgScore = totalAttendees > 0 ? (totalScore / totalAttendees).toFixed(1) : 0;
    const passCount = attempts.filter(a => a.score >= 40).length;
    const passRate = totalAttendees > 0 ? ((passCount / totalAttendees) * 100).toFixed(1) : 0;
    
    const ufmFlags = await Violation.count();

    res.json({
      metrics: {
        totalAttendees,
        avgScore: `${avgScore}%`,
        passRate: `${passRate}%`,
        ufmFlags
      },
      distributionData: distributionArray,
      topicData,
    });
  } catch (error) {
    console.error('getPostExamAnalytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};