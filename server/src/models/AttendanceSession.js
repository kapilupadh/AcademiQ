// server/src/models/AttendanceSession.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttendanceSession = sequelize.define('AttendanceSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subjects', key: 'id' },
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Departments', key: 'id' },
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // ── Class window ────────────────────────────────────────────────
  // OTP/QR generation is only allowed within this window.
  // Student submission is only accepted within this window.
  class_start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Class period start — e.g. 10:00 AM',
  },
  class_end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Class period end — e.g. 11:00 AM',
  },

  // ── Mode ────────────────────────────────────────────────────────
  mode: {
    type: DataTypes.ENUM('OTP', 'QR'),
    defaultValue: 'OTP',
    allowNull: false,
    comment: 'Teacher chooses OTP or QR for this session',
  },

  // ── OTP fields ───────────────────────────────────────────────────
  otp_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '4 or 6 digit attendance OTP',
  },
  otp_digits: {
    type: DataTypes.INTEGER,
    defaultValue: 6,
    comment: '4 or 6 — teacher choice',
  },
  otp_expiry_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'How long the OTP stays valid after generation',
  },

  // ── QR fields ────────────────────────────────────────────────────
  qr_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Short-lived token embedded in QR code',
  },

  // ── Activation ───────────────────────────────────────────────────
  activated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When teacher actually generated the OTP/QR (must be within class window)',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'activated_at + otp_expiry_minutes — when this OTP/QR stops being valid',
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'attendance_sessions',
});

module.exports = AttendanceSession;