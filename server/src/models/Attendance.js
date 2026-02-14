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
    allowNull: true, // Can be inferred from Student but good to snapshot
    validate: {
      min: 1,
      max: 6
    }
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'attendances'
});

module.exports = Attendance;
