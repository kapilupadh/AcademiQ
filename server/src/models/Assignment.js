// server/src/models/Assignment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'subjects', key: 'id' },
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  max_marks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CLOSED'),
    defaultValue: 'PUBLISHED',
  },
}, {
  timestamps: true,
  tableName: 'assignments',
});

module.exports = Assignment;
