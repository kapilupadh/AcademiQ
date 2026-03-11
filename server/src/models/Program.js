const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Program = sequelize.define('Program', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. BCA, BSc Computer Science, BA Political Science',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g. BCA, BSCS, BAPOLS',
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  duration_years: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: '3 = 6 semesters, 4 = 8 semesters',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'programs',
});

module.exports = Program;