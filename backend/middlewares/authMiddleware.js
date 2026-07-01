const jwt = require("jsonwebtoken");
const { User, Role, Enterprise } = require("../models");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.sub, {
      include: [
        { model: Role, attributes: ["id", "name", "description"] },
        { model: Enterprise, as: "enterprise", attributes: ["id", "name", "logo", "status", "subscription"] },
      ],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Session invalide",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expirée ou invalide",
    });
  }
}

/**
 * Middleware de contrôle de rôle.
 * Usage : requireRole("SUPER_ADMIN") ou requireRole("OWNER", "MANAGER")
 * Doit être placé APRÈS authenticate.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.Role?.name;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Rôle utilisateur introuvable",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé : permissions insuffisantes",
      });
    }

    next();
  };
}

module.exports = { authenticate, requireRole };
