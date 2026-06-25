// models/Role.js

const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

module.exports = Role;