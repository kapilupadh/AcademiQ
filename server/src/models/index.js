const sequelize = require('../config/database');
const User = require('./User');
const UniqueId = require('./UniqueId');
const RegistrationSession = require('./RegistrationSession');
const Department = require('./Department');

// Exam Modules
const Exam = require('./Exam');
const Question = require('./Question');
const ExamAttempt = require('./ExamAttempt');
const StudentAnswer = require('./StudentAnswer');
const Violation = require('./Violation');
const Attendance = require('./Attendance');
const ActivityLog = require('./ActivityLog');

// --- Associations ---

// User Associations
User.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(User, { foreignKey: 'student_id' });

User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Department
User.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });

// Exam <-> Question
Exam.hasMany(Question, { foreignKey: 'exam_id', onDelete: 'CASCADE' });
Question.belongsTo(Exam, { foreignKey: 'exam_id' });

// User <-> ExamAttempt (A student takes an exam)
User.hasMany(ExamAttempt, { foreignKey: 'student_id' });
ExamAttempt.belongsTo(User, { foreignKey: 'student_id' });

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


module.exports = {
  sequelize,
  User,
  UniqueId,
  Department,
  RegistrationSession,
  Exam,
  Question,
  ExamAttempt,
  StudentAnswer,
  Violation,
  Attendance,
  ActivityLog,
};
