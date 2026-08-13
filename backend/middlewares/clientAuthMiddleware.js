const jwt = require("jsonwebtoken");
const { Client, Enterprise } = require("../models");

async function authenticateClient(req, res, next) {
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

    if (payload.type !== "client" || payload.role !== "CLIENT") {
      return res.status(401).json({
        success: false,
        message: "Session invalide",
      });
    }

    const client = await Client.findByPk(payload.sub, {
      include: [
        {
          model: Enterprise,
          attributes: ["id", "name", "logo", "location"],
        },
      ],
    });

    if (!client || client.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Session invalide",
      });
    }

    req.client = client;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expirée ou invalide",
    });
  }
}

module.exports = { authenticateClient };
