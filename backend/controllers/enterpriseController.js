// controllers/enterpriseController.js

const { Enterprise, NFCCard, Client, Scan, Subscription } = require("../models");

/**
 * GET /api/enterprise/me
 * Retourne les données de l'entreprise de l'utilisateur connecté.
 * Lookup direct via req.user.enterpriseId (champ ajouté sur la table users).
 */
exports.getMyEnterprise = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const enterprise = await Enterprise.findByPk(enterpriseId, {
      include: [
        { model: Subscription },
        {
          model: NFCCard,
          attributes: ["id", "status", "cardNumber", "type", "subtype", "scanUrl", "createdAt"],
        },
        {
          model: Client,
          attributes: ["id", "name", "email", "phone", "points", "level", "status"],
        },
        {
          model: Scan,
          attributes: ["id", "createdAt", "pointsAdded", "scannedAt"],
          order: [["createdAt", "DESC"]],
          limit: 10,
          separate: true,
        },
      ],
    });

    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: "Entreprise introuvable",
      });
    }

    res.json({
      success: true,
      data: {
        ...enterprise.toJSON(),
        totalCards: enterprise.NFCCards?.length ?? 0,
        activeCards: enterprise.NFCCards?.filter((c) => c.status === "active").length ?? 0,
        totalClients: enterprise.Clients?.length ?? 0,
        totalScans: enterprise.Scans?.length ?? 0,
      },
    });
  } catch (error) {
    console.error("Get my enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos données",
    });
  }
};

/**
 * PUT /api/enterprise/me
 * Permet à l'entreprise connectée de mettre à jour ses propres informations.
 */
exports.updateMyEnterprise = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const enterprise = await Enterprise.findByPk(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ success: false, message: "Entreprise introuvable" });
    }

    const { name, phone, location, logo, adminFirstName, adminLastName } = req.body;

    await enterprise.update({
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(location !== undefined && { location }),
      ...(logo !== undefined && { logo }),
      ...(adminFirstName !== undefined && { adminFirstName }),
      ...(adminLastName !== undefined && { adminLastName }),
    });

    res.json({
      success: true,
      message: "Informations mises à jour avec succès",
      data: { enterprise },
    });
  } catch (error) {
    console.error("Update my enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
    });
  }
};
