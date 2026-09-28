const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantMenuItemOption = sequelize.define(
  "RestaurantMenuItemOption",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    optionGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "restaurant_menu_item_option_groups", key: "id" },
    },
    name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
    priceModifierMinor: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "restaurant_menu_item_options", timestamps: true },
);

module.exports = RestaurantMenuItemOption;
