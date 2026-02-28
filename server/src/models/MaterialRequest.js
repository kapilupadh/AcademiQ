const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialRequest = sequelize.define('MaterialRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  exam_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'),
    defaultValue: 'PENDING',
  },
}, {
  timestamps: true,
  tableName: 'material_requests',
});

module.exports = MaterialRequest;
