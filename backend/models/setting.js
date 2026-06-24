// models/Setting.js
// Table clé/valeur pour les paramètres globaux de la plateforme.

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Clé du paramètre (ex: platform_name, support_email)",
    },

    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    label: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Label affiché dans l'UI",
    },

    group: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "general",
      comment: "Groupe de paramètres (general, notifications, security)",
    },
  },
  {
    tableName: "settings",
    timestamps: true,
  }
);

module.exports = Setting;
