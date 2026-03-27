// server/src/models/Attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
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
  session_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'attendance_sessions', key: 'id' },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LEAVE', 'LATE'),
    defaultValue: 'PRESENT',
    allowNull: false,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 8 },
  },
  face_confidence: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: 'Face match score 0-1 from face-api.js in browser',
  },
  distance_meters: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: 'Distance from dept geofence center in meters',
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true = passed all 3 checks: QR + face + geofence',
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  selfie_url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL or path to the selfie image captured during attendance',
  },
}, {
  timestamps: true,
  tableName: 'attendances',
});

module.exports = Attendance;