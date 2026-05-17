const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccessRequest = sequelize.define('AccessRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true, // Enforced in controller
    validate: {
      is: /^\d{10}$/,
    },
  },
  role: {
    type: DataTypes.INTEGER, // 2: Teacher, 3: Student
    allowNull: false,
    validate: {
      isIn: [[2, 3]],
    },
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = AccessRequest;
