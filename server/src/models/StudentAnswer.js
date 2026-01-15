const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentAnswer = sequelize.define('StudentAnswer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  attempt_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  selected_option: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_final: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'student_answers'
});

module.exports = StudentAnswer;
