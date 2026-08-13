const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Role, Enterprise, Setting } = require("../models");
const twoFactorService = require("./twoFactorService");

const ENTERPRISE_2FA_ROLES = ["OWNER", "MANAGER"];

function sanitizeUser(user) {
  const plainUser = user.get({ plain: true });
  delete plainUser.password;
  delete plainUser.twoFactorSecret;
  delete plainUser.twoFactorBackupCodes;
  delete plainUser.resetPasswordToken;
  delete plainUser.resetPasswordExpires;
  return plainUser;
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.Role?.name,
      enterpriseId: user.enterpriseId ?? null,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

async function findUserWithIncludes(userId) {
  return User.findByPk(userId, {
    include: [
      { model: Role, attributes: ["id", "name", "description"] },
      { model: Enterprise, as: "enterprise", attributes: ["id", "name", "logo", "status", "subscription"] },
    ],
  });
}

async function is2FARequiredForUser(user) {
  const role = user.Role?.name;
  if (!role) return false;

  const keys = [];
  if (role === "SUPER_ADMIN") {
    keys.push("require_2fa_super_admin");
  }
  if (ENTERPRISE_2FA_ROLES.includes(role)) {
    keys.push("require_2fa_enterprise");
  }

  if (keys.length === 0) return false;

  const settings = await Setting.findAll({
    where: { key: { [Op.in]: keys } },
  });

  return settings.some((setting) => setting.value === "true");
}

async function computeMustSetup2FA(user) {
  return (await is2FARequiredForUser(user)) && !user.twoFactorEnabled;
}

async function login(email, password) {
  const user = await User.findOne({
    where: { email },
    include: [
      { model: Role, attributes: ["id", "name", "description"] },
      { model: Enterprise, as: "enterprise", attributes: ["id", "name", "logo", "status", "subscription"] },
    ],
  });

  if (!user || !user.isActive) {
    const error = new Error("Email ou mot de passe incorrect");
    error.statusCode = 401;
    throw error;
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);
  if (!passwordIsValid) {
    const error = new Error("Email ou mot de passe incorrect");
    error.statusCode = 401;
    throw error;
  }

  const mustSetup2FA = await computeMustSetup2FA(user);

  if (user.twoFactorEnabled) {
    return {
      requires2FA: true,
      tempToken: twoFactorService.signTempToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user),
    mustSetup2FA,
  };
}

async function verify2FA(tempToken, code, backupCode) {
  const userId = twoFactorService.verifyTempToken(tempToken);
  const user = await User.findByPk(userId, {
    include: [
      { model: Role, attributes: ["id", "name", "description"] },
      { model: Enterprise, as: "enterprise", attributes: ["id", "name", "logo", "status", "subscription"] },
    ],
  });

  if (!user || !user.isActive || !user.twoFactorEnabled) {
    const error = new Error("Session 2FA invalide");
    error.statusCode = 401;
    throw error;
  }

  let verified = false;

  if (code) {
    verified = await twoFactorService.verifyCode(user, code);
  } else if (backupCode) {
    verified = await twoFactorService.verifyBackupCode(user, backupCode);
  }

  if (!verified) {
    const error = new Error("Code 2FA invalide");
    error.statusCode = 401;
    throw error;
  }

  const mustSetup2FA = await computeMustSetup2FA(user);

  return {
    token: signToken(user),
    user: sanitizeUser(user),
    mustSetup2FA,
  };
}

async function register({ firstName, lastName, email, password }) {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("Un utilisateur existe déjà avec cet email");
    error.statusCode = 409;
    throw error;
  }

  const role = await Role.findOne({ where: { name: "OWNER" } });
  if (!role) {
    const error = new Error("Le rôle utilisateur est introuvable");
    error.statusCode = 500;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    roleId: role.id,
    enterpriseId: null,
  });

  const userWithRole = await findUserWithIncludes(
    (await User.findOne({ where: { email } })).id
  );

  return {
    token: signToken(userWithRole),
    user: sanitizeUser(userWithRole),
  };
}

async function getProfile(userId) {
  const user = await findUserWithIncludes(userId);

  if (!user || !user.isActive) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

async function getProfileWithMeta(userId) {
  const user = await findUserWithIncludes(userId);

  if (!user || !user.isActive) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  return {
    user: sanitizeUser(user),
    mustSetup2FA: await computeMustSetup2FA(user),
  };
}

async function changePassword(userId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.update(
    { password: hashedPassword, mustChangePassword: false },
    { where: { id: userId } }
  );
}

module.exports = {
  login,
  verify2FA,
  register,
  getProfile,
  getProfileWithMeta,
  changePassword,
  sanitizeUser,
  signToken,
  computeMustSetup2FA,
  ENTERPRISE_2FA_ROLES,
};
