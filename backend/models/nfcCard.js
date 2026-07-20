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
    scanToken: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: "Token unique pour l'URL de scan (généré automatiquement)",
    },
    cardTypeId: {
      type: DataTypes.UUID,
      allowNull: true, // NULL tant que la carte est en stock global (pas encore assignée à une entreprise)
      references: { model: 'card_types', key: 'id' },
    },
    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: true, // NULL = carte en stock global Maze (non encore assignée à une entreprise)
      references: {
        model: "enterprises",
        key: "id",
      },
    },
    stockBatchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Identifiant du lot de génération (ex: BATCH-2026-001)",
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "services",
        key: "id",
      },
      comment: "Service associé à cette carte (optionnel, NULL = service choisi lors du scan)",
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true, // NULL tant que la carte est en stock global (le type est attribué lors de l'assignation à une entreprise)
    },
    subtype: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    scanUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "URL de scan générée dynamiquement: {baseUrl}/{entreprise}/{type}/{scanToken}",
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
      { unique: true, fields: ["scanToken"] },
    ],
  }
);

module.exports = NFCCard;