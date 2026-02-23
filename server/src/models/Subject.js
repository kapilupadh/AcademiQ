const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. Maths-2, Physics, Data Structures',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g. MATH201',
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 8 },
    comment: 'Semester number (1-8) in which this subject is taught',
  },
  has_prerequisite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  prerequisite_note: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable prerequisite description, e.g. "Maths in 11-12"',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'subjects',
});

module.exports = Subject;
