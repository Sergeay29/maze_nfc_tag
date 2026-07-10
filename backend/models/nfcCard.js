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
    cardTypeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'card_types', key: 'id' },
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
      comment: "Service associé à cette carte pour le lien de scan",
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    subtype: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    scanUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "URL de scan générée dynamiquement: nomdedomaine.com/typedecarte/entreprise-type/token",
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