const authService = require("../services/authService");
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

    return res.json({
      success: true,
      message: "Connexion réussie",
      data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la connexion",
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
    const user = await authService.getProfile(req.user.id);

    return res.json({
      success: true,
      data: {
        user,
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

/**
 * POST /api/auth/forgot-password
 * Envoie un email de réinitialisation si l'email existe.
 * Répond toujours avec succès pour ne pas divulguer si l'email existe.
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email requis" });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    // Réponse identique que l'utilisateur existe ou non (sécurité)
    const genericMessage = "Si cet email est enregistré, un lien de réinitialisation vous a été envoyé.";

    if (user && user.isActive) {
      // Générer un token sécurisé de 64 caractères hex
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

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
        // On ne bloque pas la réponse même si l'email échoue
      }
    }

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

/**
 * POST /api/auth/reset-password
 * Réinitialise le mot de passe via le token reçu par email.
 */
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

    // Trouver l'utilisateur avec ce token valide et non expiré
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

    return res.json({ success: true, message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

module.exports = {
  login,
  register,
  me,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
