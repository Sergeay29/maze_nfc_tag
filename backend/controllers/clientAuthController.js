const clientAuthService = require("../services/clientAuthService");
const { logFromPublicReq, AUDIT_ACTIONS } = require("../services/auditService");

async function login(req, res) {
  try {
    const data = await clientAuthService.login(req.body);

    await logFromPublicReq(req, {
      clientId: data.client.id,
      enterpriseId: data.client.enterpriseId,
      action: AUDIT_ACTIONS.CLIENT_LOGIN_SUCCESS,
      resource: "auth",
      details: `Connexion portail client : ${data.client.name}`,
      success: true,
    });

    return res.json({ success: true, data });
  } catch (error) {
    await logFromPublicReq(req, {
      action: AUDIT_ACTIONS.CLIENT_LOGIN_FAILED,
      resource: "auth",
      details: `Échec connexion portail client (${req.body?.email || "inconnu"})`,
      success: false,
      errorMessage: error.message,
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Erreur lors de la connexion",
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await clientAuthService.forgotPassword(req.body);

    if (result.clientId) {
      await logFromPublicReq(req, {
        clientId: result.clientId,
        enterpriseId: result.enterpriseId,
        action: AUDIT_ACTIONS.CLIENT_RESET_PASSWORD,
        resource: "auth",
        details: "Demande réinitialisation mot de passe portail client",
        success: true,
      });
    }

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

    if (result.clientId) {
      await logFromPublicReq(req, {
        clientId: result.clientId,
        enterpriseId: result.enterpriseId,
        action: AUDIT_ACTIONS.CLIENT_RESET_PASSWORD,
        resource: "auth",
        details: "Mot de passe portail client réinitialisé",
        success: true,
      });
    }

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
