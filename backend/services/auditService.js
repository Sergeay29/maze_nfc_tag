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
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
  UPDATE_PROFILE: "UPDATE_PROFILE",
  UPLOAD_LOGO: "UPLOAD_LOGO",
  CREATE_CLIENT: "CREATE_CLIENT",
  UPDATE_CLIENT: "UPDATE_CLIENT",
  DELETE_CLIENT: "DELETE_CLIENT",
  CREATE_SERVICE: "CREATE_SERVICE",
  UPDATE_SERVICE: "UPDATE_SERVICE",
  DELETE_SERVICE: "DELETE_SERVICE",
  CREATE_REWARD: "CREATE_REWARD",
  UPDATE_REWARD: "UPDATE_REWARD",
  DELETE_REWARD: "DELETE_REWARD",
  SCAN_CARD: "SCAN_CARD",
  ADJUST_POINTS: "ADJUST_POINTS",
  REDEEM_REWARD: "REDEEM_REWARD",
  CLIENT_IDENTIFY: "CLIENT_IDENTIFY",
  CLIENT_LOGIN_SUCCESS: "CLIENT_LOGIN_SUCCESS",
  CLIENT_LOGIN_FAILED: "CLIENT_LOGIN_FAILED",
  CLIENT_RESET_PASSWORD: "CLIENT_RESET_PASSWORD",
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
  clientId = null,
  enterpriseId = null,
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
      clientId,
      enterpriseId,
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
    enterpriseId:
      data.enterpriseId ??
      req?.user?.enterpriseId ??
      req?.user?.enterprise?.id ??
      null,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    ...data,
  });
}

function logFromPublicReq(req, data) {
  const meta = getClientMeta(req);
  return log({
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
  logFromPublicReq,
};
