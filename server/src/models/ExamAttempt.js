const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamAttempt = sequelize.define('ExamAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  exam_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('WAITING_ROOM', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED'),
    defaultValue: 'WAITING_ROOM',
  },
  start_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Calculated expiration time',
  },
  assigned_questions: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Array of Question IDs assigned to this student for this attempt',
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  violation_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'exam_attempts'
});

module.exports = ExamAttempt;
