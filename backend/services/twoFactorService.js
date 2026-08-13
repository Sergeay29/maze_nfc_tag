const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateSecret, generateURI, verify } = require("otplib");
const QRCode = require("qrcode");
const { User } = require("../models");

const APP_NAME = process.env.APP_NAME || "Maze NFC";
const BACKUP_CODE_COUNT = 8;

function getEncryptionKey() {
  const secret = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET requis pour le chiffrement 2FA");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSecret(plainSecret) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(encryptedSecret) {
  const [ivHex, dataHex] = encryptedSecret.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

async function verifyTotpCode(secret, token) {
  const result = await verify({ secret, token: String(token).trim() });
  return Boolean(result.valid);
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i += 1) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

async function hashBackupCodes(codes) {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

function signTempToken(userId) {
  return jwt.sign(
    { sub: userId, purpose: "2fa" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
}

function verifyTempToken(tempToken) {
  const payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  if (payload.purpose !== "2fa") {
    const error = new Error("Token 2FA invalide");
    error.statusCode = 401;
    throw error;
  }
  return payload.sub;
}

async function setup(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (user.twoFactorEnabled) {
    const error = new Error("La 2FA est déjà activée");
    error.statusCode = 400;
    throw error;
  }

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: APP_NAME,
    label: user.email,
    secret,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  await user.update({
    twoFactorSecret: encryptSecret(secret),
    twoFactorEnabled: false,
    twoFactorBackupCodes: null,
  });

  return { qrCodeDataUrl, otpauthUrl, secret };
}

async function enable(userId, code) {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFactorSecret) {
    const error = new Error("Configuration 2FA introuvable. Relancez la configuration.");
    error.statusCode = 400;
    throw error;
  }

  const secret = decryptSecret(user.twoFactorSecret);
  const isValid = await verifyTotpCode(secret, code);
  if (!isValid) {
    const error = new Error("Code de vérification invalide");
    error.statusCode = 400;
    throw error;
  }

  const backupCodes = generateBackupCodes();
  const hashedCodes = await hashBackupCodes(backupCodes);

  await user.update({
    twoFactorEnabled: true,
    twoFactorBackupCodes: JSON.stringify(hashedCodes),
  });

  return { backupCodes };
}

async function disable(userId, password, code) {
  const user = await User.findByPk(userId);
  if (!user || !user.twoFactorEnabled) {
    const error = new Error("La 2FA n'est pas activée");
    error.statusCode = 400;
    throw error;
  }

  const passwordOk = await bcrypt.compare(password, user.password);
  if (!passwordOk) {
    const error = new Error("Mot de passe incorrect");
    error.statusCode = 401;
    throw error;
  }

  const secret = decryptSecret(user.twoFactorSecret);
  const isValid = await verifyTotpCode(secret, code);
  if (!isValid) {
    const error = new Error("Code 2FA invalide");
    error.statusCode = 400;
    throw error;
  }

  await user.update({
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
  });
}

async function verifyCode(user, code) {
  if (!user.twoFactorSecret) {
    const error = new Error("2FA non configurée");
    error.statusCode = 400;
    throw error;
  }

  const secret = decryptSecret(user.twoFactorSecret);
  return verifyTotpCode(secret, code);
}

async function verifyBackupCode(user, backupCode) {
  if (!user.twoFactorBackupCodes) {
    return false;
  }

  const hashedCodes = JSON.parse(user.twoFactorBackupCodes);
  const normalized = backupCode.trim().toUpperCase();

  for (let i = 0; i < hashedCodes.length; i += 1) {
    const match = await bcrypt.compare(normalized, hashedCodes[i]);
    if (match) {
      hashedCodes.splice(i, 1);
      await user.update({ twoFactorBackupCodes: JSON.stringify(hashedCodes) });
      return true;
    }
  }

  return false;
}

async function getStatus(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "twoFactorEnabled"],
  });

  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  return { enabled: user.twoFactorEnabled };
}

module.exports = {
  signTempToken,
  verifyTempToken,
  setup,
  enable,
  disable,
  verifyCode,
  verifyBackupCode,
  getStatus,
};
