const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UniqueId = sequelize.define('UniqueId', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unique_id: { // Renamed from 'code' to match requirements
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.INTEGER, // 1 = Admin, 2 = Teacher, 3 = Student
    defaultValue: 3,
    allowNull: false,
    validate: {
      isIn: [[1, 2, 3]]
    }
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
    allowNull: false,
  },
  generated_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  used_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Keep generated_by for admin tracking
  generated_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = UniqueId;
