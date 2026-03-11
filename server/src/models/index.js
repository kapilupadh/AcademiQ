const sequelize = require('../config/database');
const User = require('./User');
const UniqueId = require('./UniqueId');
const RegistrationSession = require('./RegistrationSession');
const Department = require('./Department');
const Program = require('./Program');        // NEW
const Subject = require('./Subject');
const StudentSubject = require('./StudentSubject');

// Exam Modules
const Exam = require('./Exam');
const Question = require('./Question');
const ExamAttempt = require('./ExamAttempt');
const StudentAnswer = require('./StudentAnswer');
const MaterialRequest = require('./MaterialRequest');
const Violation = require('./Violation');
const Attendance = require('./Attendance');
const ActivityLog = require('./ActivityLog');

// --- Associations ---

// User <-> Attendance
User.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(User, { foreignKey: 'student_id' });

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

// Subject <-> StudentSubject
Subject.hasMany(StudentSubject, { foreignKey: 'subject_id' });
StudentSubject.belongsTo(Subject, { foreignKey: 'subject_id' });

// User (student) <-> StudentSubject
User.hasMany(StudentSubject, { foreignKey: 'student_id', as: 'enrollments' });
StudentSubject.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

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

module.exports = {
  sequelize,
  User,
  UniqueId,
  Department,
  Program,
  Subject,
  StudentSubject,
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