// server/src/models/Department.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
  },
  // GPS for geofence — set once by admin
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: 'Classroom/dept building latitude',
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: 'Classroom/dept building longitude',
  },
  geofence_radius: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: 'Geofence radius in meters (default 50m)',
  },
}, {
  timestamps: true,
});

module.exports = Department;