// server/src/models/AssignmentSubmission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssignmentSubmission = sequelize.define('AssignmentSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'assignments', key: 'id' },
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  submission_content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  marks_obtained: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('SUBMITTED', 'GRADED', 'LATE'),
    defaultValue: 'SUBMITTED',
  },
}, {
  timestamps: true,
  tableName: 'assignment_submissions',
});

module.exports = AssignmentSubmission;
