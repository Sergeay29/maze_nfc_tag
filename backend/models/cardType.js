const DataTypes = require('sequelize');
const sequelize = require('../config/database.js');

const CardType = sequelize.define('CardType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'card_types',
  timestamps: true,
});

module.exports = CardType;
