// server/src/models/TeacherSubject.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherSubject = sequelize.define('TeacherSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'subjects', key: 'id' },
  },
  claimed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'teacher_subjects',
});

module.exports = TeacherSubject;