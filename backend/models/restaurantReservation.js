const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RestaurantReservation = sequelize.define(
  "RestaurantReservation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "enterprises", key: "id" },
    },
    tableId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "restaurant_tables", key: "id" },
    },
    reservationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reservationTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90,
      validate: { min: 15, max: 720 },
    },
    turnoverBufferMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      validate: { min: 0, max: 180 },
    },
    partySize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 100 },
    },
    contact: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    source: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "table",
    },
  },
  {
    tableName: "restaurant_reservations",
    timestamps: true,
  }
);

module.exports = RestaurantReservation;
