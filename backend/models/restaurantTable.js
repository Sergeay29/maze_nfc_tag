const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantTable = sequelize.define(
  "RestaurantTable",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "enterprises", key: "id" },
    },
    publicToken: { type: DataTypes.STRING(48), allowNull: false, unique: true, defaultValue: DataTypes.UUIDV4 },
    label: { type: DataTypes.STRING(80), allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2, validate: { min: 1, max: 100 } },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "restaurant_tables", timestamps: true },
);

module.exports = RestaurantTable;
