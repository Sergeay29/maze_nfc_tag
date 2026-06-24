// models/Subscription.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const Subscription = sequelize.define(
  "Subscription",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "enterprises",
        key: "id",
      },
    },

    plan: {
      type: DataTypes.ENUM("Starter", "Pro", "Enterprise"),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "paused", "cancelled"),
      defaultValue: "active",
    },

    cardsLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      comment: "Max number of cards allowed",
    },

    monthlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "subscriptions",
    timestamps: true,
  }
);

module.exports = Subscription;
