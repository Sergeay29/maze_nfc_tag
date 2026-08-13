const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Client, Enterprise } = require("../models");
const { sendPasswordResetEmail } = require("./emailService");

function sanitizeClient(client) {
  const plain = client.get({ plain: true });
  delete plain.password;
  delete plain.resetPasswordToken;
  delete plain.resetPasswordExpires;
  return plain;
}

function signClientToken(client) {
  return jwt.sign(
    {
      sub: client.id,
      role: "CLIENT",
      enterpriseId: client.enterpriseId,
      type: "client",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.CLIENT_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

async function findClientWithEnterprise(clientId) {
  return Client.findByPk(clientId, {
    include: [
      {
        model: Enterprise,
        attributes: ["id", "name", "logo", "location"],
      },
    ],
  });
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    const error = new Error("Email et mot de passe requis");
    error.statusCode = 400;
    throw error;
  }

  const clients = await Client.findAll({
    where: {
      email: { [Op.iLike]: normalizedEmail },
      status: "active",
    },
    include: [
      {
        model: Enterprise,
        attributes: ["id", "name", "logo", "location"],
      },
    ],
  });

  if (clients.length === 0) {
    const error = new Error("Email ou mot de passe incorrect");
    error.statusCode = 401;
    throw error;
  }

  let matchedClient = null;

  for (const client of clients) {
    if (!client.password) continue;

    const isValid = await bcrypt.compare(password, client.password);
    if (isValid) {
      if (matchedClient) {
        const error = new Error(
          "Plusieurs comptes correspondent à cet email. Contactez votre établissement."
        );
        error.statusCode = 409;
        throw error;
      }
      matchedClient = client;
    }
  }

  if (!matchedClient) {
    const hasAccountWithoutPassword = clients.some((client) => !client.password);
    const error = new Error(
      hasAccountWithoutPassword
        ? "Aucun mot de passe défini pour ce compte. Utilisez « Mot de passe oublié » pour en créer un."
        : "Email ou mot de passe incorrect"
    );
    error.statusCode = 401;
    throw error;
  }

  await matchedClient.update({ lastActivity: new Date() });

  return {
    token: signClientToken(matchedClient),
    client: sanitizeClient(matchedClient),
  };
}

async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    const error = new Error("Email requis");
    error.statusCode = 400;
    throw error;
  }

  const genericMessage =
    "Si cet email est enregistré, un lien de réinitialisation vous a été envoyé.";

  const client = await Client.findOne({
    where: {
      email: { [Op.iLike]: normalizedEmail },
      status: "active",
    },
    order: [["lastActivity", "DESC NULLS LAST"], ["updatedAt", "DESC"]],
  });

  if (client?.email) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await client.update({
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl.split(",")[0].trim()}/client/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(client.email, resetUrl);
    } catch (mailErr) {
      console.error("Erreur envoi email reset client:", mailErr);
    }
  }

  return { message: genericMessage, clientId: client?.id ?? null, enterpriseId: client?.enterpriseId ?? null };
}

async function resetPassword({ token, password }) {
  if (!token || !password) {
    const error = new Error("Token et mot de passe requis");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Le mot de passe doit contenir au moins 8 caractères");
    error.statusCode = 400;
    throw error;
  }

  const client = await Client.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: new Date() },
      status: "active",
    },
  });

  if (!client) {
    const error = new Error("Lien invalide ou expiré. Veuillez refaire une demande.");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await client.update({
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  return {
    message: "Mot de passe réinitialisé avec succès.",
    clientId: client.id,
    enterpriseId: client.enterpriseId,
  };
}

async function getMe(clientId) {
  const client = await findClientWithEnterprise(clientId);

  if (!client || client.status !== "active") {
    const error = new Error("Session invalide");
    error.statusCode = 401;
    throw error;
  }

  return sanitizeClient(client);
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  getMe,
  sanitizeClient,
};
