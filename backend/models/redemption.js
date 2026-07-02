const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Redemption = sequelize.define("Redemption", {
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
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "clients",
      key: "id",
    },
  },
  rewardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "rewards",
      key: "id",
    },
  },
  pointsUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
    allowNull: false,
    defaultValue: "pending",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "redemptions",
  timestamps: true,
});

module.exports = Redemption;
