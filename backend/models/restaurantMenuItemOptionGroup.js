const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantMenuItemOptionGroup = sequelize.define(
  "RestaurantMenuItemOptionGroup",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    menuItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "restaurant_menu_items", key: "id" },
    },
    name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
    selectionType: { type: DataTypes.ENUM("single", "multiple"), allowNull: false, defaultValue: "single" },
    minSelections: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0, max: 20 } },
    maxSelections: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1, max: 20 } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "restaurant_menu_item_option_groups", timestamps: true },
);

module.exports = RestaurantMenuItemOptionGroup;
