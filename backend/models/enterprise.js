// models/Enterprise.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const Enterprise = sequelize.define(
  "Enterprise",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    adminFirstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    adminLastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    subscription: {
      type: DataTypes.ENUM("Starter", "Pro", "Enterprise"),
      defaultValue: "Starter",
    },

    status: {
      type: DataTypes.ENUM("active", "suspended", "inactive"),
      defaultValue: "active",
    },

    cardsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    scansCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    modules: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ["Fidélité"],
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "enterprises",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["name"] },
      { unique: true, fields: ["email"] },
    ],
  }
);

module.exports = Enterprise;
