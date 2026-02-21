const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  exam_id: {
    type: DataTypes.UUID,
    allowNull: false,
    // References defined in associations
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  question_type: {
    type: DataTypes.ENUM('MCQ'),
    defaultValue: 'MCQ',
    allowNull: false,
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false,
    // Array of strings ["Option A", "Option B", ...]
  },
  correct_answer: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The correct option string or index. Not sent to client.',
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  timestamps: true,
  tableName: 'questions'
});

module.exports = Question;
