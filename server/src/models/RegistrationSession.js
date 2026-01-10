const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RegistrationSession = sequelize.define('RegistrationSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unique_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  session_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'EXPIRED'),
    defaultValue: 'PENDING',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = RegistrationSession;
