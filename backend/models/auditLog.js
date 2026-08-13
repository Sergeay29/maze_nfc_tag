const DataTypes = require("sequelize");
const sequelize = require("../config/database.js");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: "resourceType",
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = AuditLog;
