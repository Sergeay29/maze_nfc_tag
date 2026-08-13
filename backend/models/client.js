// models/Client.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const Client = sequelize.define(
  "Client",
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
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "enterprises",
        key: "id",
      },
    },

    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    level: {
      type: DataTypes.ENUM("Silver", "Gold", "Platinum"),
      defaultValue: "Silver",
    },

    photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "suspended", "inactive"),
      defaultValue: "active",
    },

    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    resetPasswordToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "clients",
    timestamps: true,
  }
);

module.exports = Client;
