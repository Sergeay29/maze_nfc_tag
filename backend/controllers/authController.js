const authService = require("../services/authService");
const twoFactorService = require("../services/twoFactorService");
const { logFromReq, AUDIT_ACTIONS } = require("../services/auditService");
const crypto = require("crypto");
const { User } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sendPasswordResetEmail } = require("../services/emailService");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    const data = await authService.login(email, password);

    if (data.requires2FA) {
      return res.json({
        success: true,
        message: "Code 2FA requis",
        data,
      });
    }

    await logFromReq(req, {
      userId: data.user.id,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      resource: "auth",
      details: `Connexion réussie (${email})`,
      success: true,
    });

    return res.json({
      success: true,
      message: "Connexion réussie",
      data,
    });
  } catch (error) {
    await logFromReq(req, {
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resource: "auth",
      details: `Échec connexion (${req.body?.email || "inconnu"})`,
      success: false,
      errorMessage: error.message,
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la connexion",
    });
  }
}

async function verify2FA(req, res) {
  try {
    const { tempToken, code, backupCode } = req.body;

    if (!tempToken || (!code && !backupCode)) {
      return res.status(400).json({
        success: false,
        message: "Token temporaire et code 2FA requis",
      });
    }

    const data = await authService.verify2FA(tempToken, code, backupCode);

    await logFromReq(req, {
      userId: data.user.id,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      resource: "auth",
      details: "Connexion réussie avec 2FA",
      success: true,
    });

    return res.json({
      success: true,
      message: "Connexion réussie",
      data,
    });
  } catch (error) {
    await logFromReq(req, {
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resource: "auth",
      details: "Échec vérification 2FA",
      success: false,
      errorMessage: error.message,
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la vérification 2FA",
    });
  }
}

async function setup2FA(req, res) {
  try {
    const data = await twoFactorService.setup(req.user.id);
    return res.json({
      success: true,
      message: "Scannez le QR code avec votre application d'authentification",
      data,
    });
  } catch (error) {
    console.error("setup2FA error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la configuration 2FA",
    });
  }
}

async function enable2FA(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code requis" });
    }

    const data = await twoFactorService.enable(req.user.id, code);

    await logFromReq(req, {
      action: AUDIT_ACTIONS.ENABLE_2FA,
      resource: "auth",
      resourceId: req.user.id,
      details: "Authentification à double facteur activée",
      success: true,
    });

    return res.json({
      success: true,
      message: "2FA activée avec succès. Conservez vos codes de secours.",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de l'activation 2FA",
    });
  }
}

async function disable2FA(req, res) {
  try {
    const { password, code } = req.body;
    if (!password || !code) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe et code 2FA requis",
      });
    }

    await twoFactorService.disable(req.user.id, password, code);

    await logFromReq(req, {
      action: AUDIT_ACTIONS.DISABLE_2FA,
      resource: "auth",
      resourceId: req.user.id,
      details: "Authentification à double facteur désactivée",
      success: true,
    });

    return res.json({
      success: true,
      message: "2FA désactivée avec succès",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la désactivation 2FA",
    });
  }
}

async function get2FAStatus(req, res) {
  try {
    const data = await twoFactorService.getStatus(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur",
    });
  }
}

async function register(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Prénom, nom, email et mot de passe requis",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    const data = await authService.register({
      firstName,
      lastName,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la création de l'utilisateur",
    });
  }
}

async function me(req, res) {
  try {
    const { user, mustSetup2FA } = await authService.getProfileWithMeta(req.user.id);

    return res.json({
      success: true,
      data: {
        user,
        mustSetup2FA,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la récupération du profil",
    });
  }
}

async function updateMe(req, res) {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    if (email) {
      const existing = await require('../models').User.findOne({ where: { email } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });
      }
    }

    await require('../models').User.update(
      { firstName: firstName || undefined, lastName: lastName || undefined, email: email || undefined },
      { where: { id: userId } }
    );

    const user = await authService.getProfile(userId);

    await logFromReq(req, {
      action: AUDIT_ACTIONS.UPDATE_PROFILE,
      resource: "user",
      resourceId: userId,
      details: `Profil mis à jour (${user.email})`,
      success: true,
    });

    return res.json({ success: true, message: "Profil mis à jour", data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Erreur" });
  }
}

async function changePassword(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    await authService.changePassword(req.user.id, newPassword);

    await logFromReq(req, {
      action: AUDIT_ACTIONS.CHANGE_PASSWORD,
      resource: "auth",
      details: `Mot de passe modifié (${req.user.email})`,
      success: true,
    });

    return res.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors du changement de mot de passe",
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email requis" });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    const genericMessage = "Si cet email est enregistré, un lien de réinitialisation vous a été envoyé.";

    if (user && user.isActive) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await user.update({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (mailErr) {
        console.error("Erreur envoi email reset:", mailErr);
      }

      await logFromReq(req, {
        userId: user.id,
        action: AUDIT_ACTIONS.RESET_PASSWORD,
        resource: "auth",
        details: `Demande réinitialisation mot de passe (${user.email})`,
        success: true,
      });
    }

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token et mot de passe requis" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Lien invalide ou expiré. Veuillez refaire une demande.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({
      password: hashedPassword,
      mustChangePassword: false,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    await logFromReq(req, {
      userId: user.id,
      enterpriseId: user.enterpriseId,
      action: AUDIT_ACTIONS.RESET_PASSWORD,
      resource: "auth",
      details: `Mot de passe réinitialisé (${user.email})`,
      success: true,
    });

    return res.json({ success: true, message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

module.exports = {
  login,
  verify2FA,
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
  register,
  me,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
