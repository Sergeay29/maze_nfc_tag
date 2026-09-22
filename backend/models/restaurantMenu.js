const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantMenu = sequelize.define(
  "RestaurantMenu",
  {
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
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "Menu principal",
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
  },
  {
    tableName: "restaurant_menus",
    timestamps: true,
  }
);

module.exports = RestaurantMenu;
