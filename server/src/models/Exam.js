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
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'exams'
});

module.exports = Exam;
