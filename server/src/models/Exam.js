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
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'exams'
});

module.exports = Exam;
