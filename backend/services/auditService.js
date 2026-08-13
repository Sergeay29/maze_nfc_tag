const { AuditLog } = require("../models");

const AUDIT_ACTIONS = {
  CREATE_ENTERPRISE: "CREATE_ENTERPRISE",
  UPDATE_ENTERPRISE: "UPDATE_ENTERPRISE",
  DELETE_ENTERPRISE: "DELETE_ENTERPRISE",
  GENERATE_CARDS: "GENERATE_CARDS",
  ASSIGN_CARD: "ASSIGN_CARD",
  DELETE_CARD: "DELETE_CARD",
  CREATE_USER: "CREATE_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  UPDATE_SUBSCRIPTION: "UPDATE_SUBSCRIPTION",
  UPDATE_CARD: "UPDATE_CARD",
  RESET_PASSWORD: "RESET_PASSWORD",
  ENABLE_2FA: "ENABLE_2FA",
  DISABLE_2FA: "DISABLE_2FA",
};

function getClientMeta(req) {
  if (!req) {
    return { ipAddress: null, userAgent: null };
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress = forwarded
    ? String(forwarded).split(",")[0].trim()
    : req.ip || req.connection?.remoteAddress || null;

  return {
    ipAddress,
    userAgent: req.headers["user-agent"] || null,
  };
}

async function log({
  userId = null,
  action,
  resource,
  resourceId = null,
  details = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
  success = true,
  errorMessage = null,
}) {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      success,
      errorMessage,
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

function logFromReq(req, data) {
  const meta = getClientMeta(req);
  return log({
    userId: req?.user?.id ?? data.userId ?? null,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    ...data,
  });
}

module.exports = {
  AUDIT_ACTIONS,
  getClientMeta,
  log,
  logFromReq,
};
