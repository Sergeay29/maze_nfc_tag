// models/User.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    resetPasswordToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },

    // Lien direct vers l'entreprise — NULL pour SUPER_ADMIN, UUID pour OWNER/MANAGER/EMPLOYEE
    enterpriseId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "enterprises",
        key: "id",
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [{ unique: true, fields: ["email"] }],
  }
);

module.exports = User;