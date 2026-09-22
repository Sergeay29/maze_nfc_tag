const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantOrder = sequelize.define(
  "RestaurantOrder",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "enterprises", key: "id" },
    },
    publicOrderToken: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    tableReference: { type: DataTypes.STRING(80), allowNull: true },
    contact: { type: DataTypes.STRING(160), allowNull: true },
    customerNote: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "preparing", "ready", "served", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("unpaid", "paid", "failed"),
      allowNull: false,
      defaultValue: "unpaid",
    },
    totalMinor: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
  },
  { tableName: "restaurant_orders", timestamps: true }
);

module.exports = RestaurantOrder;
