const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reward = sequelize.define("Reward", {
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
  title: {
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
  pointsRequired: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: "general",
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  },
}, {
  tableName: "rewards",
  timestamps: true,
});

module.exports = Reward;
