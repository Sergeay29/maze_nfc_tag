// models/NFCCard.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const NFCCard = sequelize.define(
  "NFCCard",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    cardNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    cardCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Unique short code for URL (e.g., ABC123)",
    },

    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "enterprises",
        key: "id",
      },
    },

    type: {
      type: DataTypes.ENUM("Loyalty", "VIP", "Business", "Client"),
      defaultValue: "Loyalty",
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "unassigned"),
      defaultValue: "unassigned",
    },

    assignedToClientId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "clients",
        key: "id",
      },
    },

    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    generatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "nfc_cards",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["cardNumber"] },
      { unique: true, fields: ["cardCode"] },
    ],
  }
);

module.exports = NFCCard;
