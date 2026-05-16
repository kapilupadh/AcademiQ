//server/src/models/User.js 
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
    references: { model: UniqueId, key: 'unique_id' },
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Departments', key: 'id' },
  },
  program_id: {                          // NEW — Phase 1
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'programs', key: 'id' },
  },
  current_semester: {                    // NEW — Phase 1
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 8 },
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
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true, // Will be enforced in controller during registration
    validate: {
      is: /^\d{10}$/, // Exactly 10 digits
    },
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
    type: DataTypes.INTEGER, // 1=Admin 2=Teacher 3=Student
    defaultValue: 3,
    allowNull: false,
    validate: { isIn: [[1, 2, 3]] },
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
  hooks: {
    beforeDestroy: async (user, options) => {
      try {
        const { AccessRequest } = user.sequelize.models;
        if (AccessRequest) {
          await AccessRequest.destroy({
            where: { email: user.email },
            transaction: options.transaction
          });
          console.log(`[HOOK] Deleted AccessRequest for user: ${user.email}`);
        }
      } catch (err) {
        console.error('[HOOK] Error deleting associated AccessRequest:', err);
      }
    }
  }
});

module.exports = User;