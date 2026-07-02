const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Service = sequelize.define("Service", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "enterprises",
      key: "id",
    },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pointsToAdd: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 0,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: "#6A35FF",
  },
}, {
  tableName: "services",
  timestamps: true,
});

module.exports = Service;
