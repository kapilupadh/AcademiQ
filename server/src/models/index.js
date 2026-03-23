// server/src/models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const UniqueId = require('./UniqueId');
const RegistrationSession = require('./RegistrationSession');
const Department = require('./Department');
const Program = require('./Program');
const Subject = require('./Subject');
const StudentSubject = require('./StudentSubject');
const TeacherSubject = require('./TeacherSubject');
const AttendanceSession = require('./AttendanceSession');
const Exam = require('./Exam');
const Question = require('./Question');
const ExamAttempt = require('./ExamAttempt');
const StudentAnswer = require('./StudentAnswer');
const MaterialRequest = require('./MaterialRequest');
const Violation = require('./Violation');
const Attendance = require('./Attendance');
const ActivityLog = require('./ActivityLog');

// ── User associations ─────────────────────────────────────────────────────────
User.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });

// ── Department / Program / Subject ────────────────────────────────────────────
Department.hasMany(Program, { foreignKey: 'department_id' });
Program.belongsTo(Department, { foreignKey: 'department_id' });

Program.hasMany(Subject, { foreignKey: 'program_id' });
Subject.belongsTo(Program, { foreignKey: 'program_id', as: 'program' });

Department.hasMany(Subject, { foreignKey: 'department_id' });
Subject.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// ── Teacher <-> Subject (claiming) ────────────────────────────────────────────
User.belongsToMany(Subject, {
  through: TeacherSubject,
  foreignKey: 'teacher_id',
  otherKey: 'subject_id',
  as: 'claimedSubjects',
});
Subject.belongsToMany(User, {
  through: TeacherSubject,
  foreignKey: 'subject_id',
  otherKey: 'teacher_id',
  as: 'claimingTeachers',
});
TeacherSubject.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
TeacherSubject.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// ── Student <-> Subject ───────────────────────────────────────────────────────
Subject.hasMany(StudentSubject, { foreignKey: 'subject_id' });
StudentSubject.belongsTo(Subject, { foreignKey: 'subject_id' });
User.hasMany(StudentSubject, { foreignKey: 'student_id', as: 'enrollments' });
StudentSubject.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// ── Attendance ────────────────────────────────────────────────────────────────
User.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(User, { foreignKey: 'student_id' });
User.hasMany(Attendance, { foreignKey: 'teacher_id', as: 'markedAttendances' });
Attendance.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Subject.hasMany(Attendance, { foreignKey: 'subject_id' });
Attendance.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// ── AttendanceSession ─────────────────────────────────────────────────────────
Subject.hasMany(AttendanceSession, { foreignKey: 'subject_id' });
AttendanceSession.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
User.hasMany(AttendanceSession, { foreignKey: 'teacher_id', as: 'attendanceSessions' });
AttendanceSession.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Department.hasMany(AttendanceSession, { foreignKey: 'department_id' });
AttendanceSession.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
AttendanceSession.hasMany(Attendance, { foreignKey: 'session_id' });
Attendance.belongsTo(AttendanceSession, { foreignKey: 'session_id', as: 'session' });

// ── ActivityLog ───────────────────────────────────────────────────────────────
User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

// ── Exam associations ─────────────────────────────────────────────────────────
Exam.hasMany(Question, { foreignKey: 'exam_id', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Exam, { foreignKey: 'exam_id' });
Exam.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(Exam, { foreignKey: 'department_id' });
Exam.belongsTo(Subject, { foreignKey: 'subject_id' });
Subject.hasMany(Exam, { foreignKey: 'subject_id' });
User.hasMany(ExamAttempt, { foreignKey: 'student_id', as: 'attempts' });
ExamAttempt.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Exam.hasMany(ExamAttempt, { foreignKey: 'exam_id' });
ExamAttempt.belongsTo(Exam, { foreignKey: 'exam_id' });
ExamAttempt.hasMany(StudentAnswer, { foreignKey: 'attempt_id', onDelete: 'CASCADE' });
StudentAnswer.belongsTo(ExamAttempt, { foreignKey: 'attempt_id' });
Question.hasMany(StudentAnswer, { foreignKey: 'question_id' });
StudentAnswer.belongsTo(Question, { foreignKey: 'question_id' });
ExamAttempt.hasMany(Violation, { foreignKey: 'attempt_id', onDelete: 'CASCADE' });
Violation.belongsTo(ExamAttempt, { foreignKey: 'attempt_id' });
User.hasMany(MaterialRequest, { foreignKey: 'student_id', as: 'requests' });
MaterialRequest.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Exam.hasMany(MaterialRequest, { foreignKey: 'exam_id' });
MaterialRequest.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

module.exports = {
  sequelize,
  User,
  UniqueId,
  Department,
  Program,
  Subject,
  StudentSubject,
  TeacherSubject,
  AttendanceSession,
  RegistrationSession,
  Exam,
  Question,
  ExamAttempt,
  StudentAnswer,
  MaterialRequest,
  Violation,
  Attendance,
  ActivityLog,
};