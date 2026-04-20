// server/src/models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const UniqueId = require('./UniqueId');
const RegistrationSession = require('./RegistrationSession');
const Department = require('./Department');
const Program = require('./Program');
const Subject = require('./Subject');
const StudentSubject = require('./StudentSubject');
const AttendanceSession = require('./AttendanceSession');

// Exam Modules
const Exam = require('./Exam');
const Question = require('./Question');
const ExamAttempt = require('./ExamAttempt');
const StudentAnswer = require('./StudentAnswer');
const MaterialRequest = require('./MaterialRequest');
const Violation = require('./Violation');
const Attendance = require('./Attendance');
const ActivityLog = require('./ActivityLog');
const Assignment = require('./Assignment');
const AssignmentSubmission = require('./AssignmentSubmission');

// ── Associations ──────────────────────────────────────────────────────────────

// User <-> Attendance (as student)
User.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(User, { foreignKey: 'student_id' });

// User <-> Attendance (as teacher who marked)
User.hasMany(Attendance, { foreignKey: 'teacher_id', as: 'markedAttendances' });
Attendance.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// User <-> ActivityLog
User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Department
User.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });

// Department <-> Program
Department.hasMany(Program, { foreignKey: 'department_id' });
Program.belongsTo(Department, { foreignKey: 'department_id' });

// Program <-> Subject
Program.hasMany(Subject, { foreignKey: 'program_id' });
Subject.belongsTo(Program, { foreignKey: 'program_id', as: 'program' });

// Department <-> Subject
Department.hasMany(Subject, { foreignKey: 'department_id' });
Subject.belongsTo(Department, { foreignKey: 'department_id' });

// Teacher <-> Subject
User.hasMany(Subject, { foreignKey: 'teacher_id', as: 'taughtSubjects' });
Subject.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Subject <-> StudentSubject
Subject.hasMany(StudentSubject, { foreignKey: 'subject_id' });
StudentSubject.belongsTo(Subject, { foreignKey: 'subject_id' });

// User (student) <-> StudentSubject
User.hasMany(StudentSubject, { foreignKey: 'student_id', as: 'enrollments' });
StudentSubject.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Subject <-> Attendance
Subject.hasMany(Attendance, { foreignKey: 'subject_id' });
Attendance.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// AttendanceSession associations
Subject.hasMany(AttendanceSession, { foreignKey: 'subject_id' });
AttendanceSession.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

User.hasMany(AttendanceSession, { foreignKey: 'teacher_id', as: 'attendanceSessions' });
AttendanceSession.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

Department.hasMany(AttendanceSession, { foreignKey: 'department_id' });
AttendanceSession.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

AttendanceSession.hasMany(Attendance, { foreignKey: 'session_id' });
Attendance.belongsTo(AttendanceSession, { foreignKey: 'session_id', as: 'session' });

// Exam <-> Question
Exam.hasMany(Question, { foreignKey: 'exam_id', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Exam, { foreignKey: 'exam_id' });

// Exam <-> Department
Exam.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(Exam, { foreignKey: 'department_id' });

// Exam <-> Subject
Exam.belongsTo(Subject, { foreignKey: 'subject_id' });
Subject.hasMany(Exam, { foreignKey: 'subject_id' });

// User <-> ExamAttempt
User.hasMany(ExamAttempt, { foreignKey: 'student_id', as: 'attempts' });
ExamAttempt.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Exam <-> ExamAttempt
Exam.hasMany(ExamAttempt, { foreignKey: 'exam_id' });
ExamAttempt.belongsTo(Exam, { foreignKey: 'exam_id' });

// ExamAttempt <-> StudentAnswer
ExamAttempt.hasMany(StudentAnswer, { foreignKey: 'attempt_id', onDelete: 'CASCADE' });
StudentAnswer.belongsTo(ExamAttempt, { foreignKey: 'attempt_id' });

// Question <-> StudentAnswer
Question.hasMany(StudentAnswer, { foreignKey: 'question_id' });
StudentAnswer.belongsTo(Question, { foreignKey: 'question_id' });

// ExamAttempt <-> Violation
ExamAttempt.hasMany(Violation, { foreignKey: 'attempt_id', onDelete: 'CASCADE' });
Violation.belongsTo(ExamAttempt, { foreignKey: 'attempt_id' });

// User <-> MaterialRequest
User.hasMany(MaterialRequest, { foreignKey: 'student_id', as: 'requests' });
MaterialRequest.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Exam <-> MaterialRequest
Exam.hasMany(MaterialRequest, { foreignKey: 'exam_id' });
MaterialRequest.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

// Subject <-> Assignment
Subject.hasMany(Assignment, { foreignKey: 'subject_id' });
Assignment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// User (Teacher) <-> Assignment
User.hasMany(Assignment, { foreignKey: 'teacher_id', as: 'createdAssignments' });
Assignment.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Assignment <-> AssignmentSubmission
Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignment_id', onDelete: 'CASCADE' });
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignment_id' });

// User (Student) <-> AssignmentSubmission
User.hasMany(AssignmentSubmission, { foreignKey: 'student_id', as: 'submissions' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

module.exports = {
  sequelize,
  User,
  UniqueId,
  Department,
  Program,
  Subject,
  StudentSubject,
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
  Assignment,
  AssignmentSubmission,
};