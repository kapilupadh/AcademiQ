const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * StudentSubject — enrollment/eligibility junction table.
 * Each row represents one student being enrolled in one subject.
 * is_eligible can be set to false if admin marks a student as ineligible
 * (e.g. missing prerequisite background).
 */
const StudentSubject = sequelize.define('StudentSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g. 2025-26',
  },
  is_eligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'false if student lacks prerequisite (e.g. no Maths in 11-12)',
  },
}, {
  timestamps: true,
  tableName: 'student_subjects',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'subject_id', 'academic_year'],
      name: 'unique_student_subject_year',
    },
  ],
});

module.exports = StudentSubject;
