const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantReservationSettings = sequelize.define(
  "RestaurantReservationSettings",
  {
    enterpriseId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: { model: "enterprises", key: "id" },
    },
    defaultDurationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 90, validate: { min: 15, max: 720 } },
    turnoverBufferMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15, validate: { min: 0, max: 180 } },
    allowPublicBookings: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "restaurant_reservation_settings", timestamps: true },
);

module.exports = RestaurantReservationSettings;
