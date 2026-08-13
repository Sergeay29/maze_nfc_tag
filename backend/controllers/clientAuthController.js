const clientAuthService = require("../services/clientAuthService");

async function login(req, res) {
  try {
    const data = await clientAuthService.login(req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la connexion",
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await clientAuthService.forgotPassword(req.body);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur serveur",
    });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await clientAuthService.resetPassword(req.body);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur serveur",
    });
  }
}

async function me(req, res) {
  try {
    const client = await clientAuthService.getMe(req.client.id);
    return res.json({ success: true, data: client });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur serveur",
    });
  }
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  me,
};
