// models/Scan.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const Scan = sequelize.define(
  "Scan",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    cardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "nfc_cards",
        key: "id",
      },
    },

    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
    },

    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "enterprises",
        key: "id",
      },
    },

    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "services",
        key: "id",
      },
    },

    scannedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    pointsAdded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "scans",
    timestamps: true,
  }
);

module.exports = Scan;
