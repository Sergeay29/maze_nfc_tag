const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

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
        {
          model: Role,
          attributes: ["id", "name", "description"],
        },
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

module.exports = {
  authenticate,
};
