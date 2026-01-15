const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UniqueId = require('./UniqueId');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unique_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: UniqueId,
      key: 'unique_id',
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  college_roll_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('student', 'admin', 'teacher'),
    defaultValue: 'student',
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  registered_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = User;
