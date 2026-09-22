const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantMenuCategory = sequelize.define(
  "RestaurantMenuCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    menuId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "restaurant_menus",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "restaurant_menu_categories",
    timestamps: true,
  }
);

module.exports = RestaurantMenuCategory;
