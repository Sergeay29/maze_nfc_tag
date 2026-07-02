const authService = require("../services/authService");

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

module.exports = {
  login,
  register,
  me,
  changePassword,
};
