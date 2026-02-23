const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60,
  },
  total_questions_to_ask: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
  passing_percentage: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 40.0,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true, // Optional initially, but recommended
  },
  type: {
    type: DataTypes.ENUM('Test', 'Sessional 1', 'Sessional 2', 'Sessional 3'),
    defaultValue: 'Test',
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Scheduled', 'Live', 'Completed'),
    defaultValue: 'Draft',
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scheduled_start_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Informational scheduled start time for student notifications',
  },
  scheduled_end_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Informational scheduled end time for student notifications',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Department this exam belongs to — used for email targeting',
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 8 },
    comment: 'Semester number for which this exam is scheduled',
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK to Subject — used for enrollment-level email filtering',
  },
}, {
  timestamps: true,
  tableName: 'exams'
});

module.exports = Exam;
