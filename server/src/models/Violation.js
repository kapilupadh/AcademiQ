const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Violation = sequelize.define('Violation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  attempt_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('TAB_SWITCH', 'FULLSCREEN_EXIT', 'MOUSE_LEAVE', 'DEBUGGER_DETECTED'),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Any extra info like browser agent, etc.',
  },
}, {
  timestamps: true,
  tableName: 'violations'
});

module.exports = Violation;
