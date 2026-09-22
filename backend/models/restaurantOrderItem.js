const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantOrderItem = sequelize.define(
  "RestaurantOrderItem",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "restaurant_orders", key: "id" },
    },
    menuItemId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "restaurant_menu_items", key: "id" },
    },
    nameSnapshot: { type: DataTypes.STRING(150), allowNull: false },
    unitPriceMinor: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 20 } },
    lineTotalMinor: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
  },
  { tableName: "restaurant_order_items", timestamps: true }
);

module.exports = RestaurantOrderItem;
