// controllers/scanController.js

const { Service, Enterprise, Client, NFCCard, Scan } = require("../models");
const { Op } = require("sequelize");

/**
 * GET /api/scan/card/:token
 * Récupérer les informations de la carte et les services disponibles via le token
 * Route publique (pas d'authentification requise)
 */
exports.getCardInfo = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token manquant",
      });
    }

    // Trouver la carte via le scanToken
    const card = await NFCCard.findOne({
      where: { scanToken: token },
      include: [
        {
          model: Enterprise,
          attributes: ["id", "name", "logo", "location", "phone", "email"],
        },
      ],
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte introuvable ou lien invalide",
      });
    }

    // Récupérer tous les services actifs de l'entreprise
    const services = await Service.findAll({
      where: {
        enterpriseId: card.enterpriseId,
        isActive: true,
      },
      attributes: ["id", "name", "description", "pointsToAdd", "icon", "color"],
      order: [["createdAt", "ASC"]],
    });

    // Retourner les infos pour afficher la page de scan
    res.json({
      success: true,
      data: {
        card: {
          id: card.id,
          cardCode: card.cardCode,
          cardNumber: card.cardNumber,
          type: card.type,
          subtype: card.subtype,
        },
        enterprise: {
          id: card.Enterprise.id,
          name: card.Enterprise.name,
          logo: card.Enterprise.logo,
          location: card.Enterprise.location,
          phone: card.Enterprise.phone,
        },
        services,
      },
    });
  } catch (error) {
    console.error("getCardInfo error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des informations",
    });
  }
};

/**
 * POST /api/scan/validate-service
 * Valider un scan avec sélection de service et vérification du cardCode
 * Route publique (identification via phone/email + cardCode)
 */
exports.validateServiceScan = async (req, res) => {
  try {
    const { scanToken, cardCode, serviceId, phone, email, name } = req.body;

    // Validations
    if (!scanToken) {
      return res.status(400).json({
        success: false,
        message: "Token manquant",
      });
    }

    if (!cardCode) {
      return res.status(400).json({
        success: false,
        message: "Code de la carte requis",
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service requis",
      });
    }

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Téléphone ou email requis",
      });
    }

    // 1. Trouver la carte via scanToken ET vérifier le cardCode
    const card = await NFCCard.findOne({
      where: {
        scanToken,
        cardCode,  // Vérification de sécurité
      },
      include: [Enterprise],
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte introuvable ou code invalide",
      });
    }

    const enterpriseId = card.enterpriseId;

    // 2. Vérifier que le service existe et appartient à cette entreprise
    const service = await Service.findOne({
      where: {
        id: serviceId,
        enterpriseId,
        isActive: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service introuvable ou inactif",
      });
    }

    // 3. Trouver ou créer le client
    let client = await Client.findOne({
      where: {
        enterpriseId,
        [Op.or]: [
          phone ? { phone } : null,
          email ? { email } : null,
        ].filter(Boolean),
      },
    });

    if (!client) {
      // Créer un nouveau client
      client = await Client.create({
        name: name || "Client",
        email: email || null,
        phone: phone || null,
        enterpriseId,
        points: 0,
        level: "Silver",
      });
    }

    // 4. Créer le scan et ajouter les points
    const scan = await Scan.create({
      cardId: card.id,
      clientId: client.id,
      enterpriseId,
      serviceId: service.id,
      pointsAdded: service.pointsToAdd,
      notes: `Scan via carte ${card.cardCode} - Service: ${service.name}`,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    // 5. Mettre à jour les points du client
    const newPoints = client.points + service.pointsToAdd;
    await client.update({
      points: newPoints,
      lastActivity: new Date(),
    });

    // 6. Mettre à jour le niveau du client
    let newLevel = "Silver";
    if (newPoints >= 5000) {
      newLevel = "Platinum";
    } else if (newPoints >= 1000) {
      newLevel = "Gold";
    }

    if (client.level !== newLevel) {
      await client.update({ level: newLevel });
    }

    // 7. Retourner le résultat
    res.status(201).json({
      success: true,
      message: `+${service.pointsToAdd} points ajoutés !`,
      data: {
        pointsAdded: service.pointsToAdd,
        totalPoints: newPoints,
        level: newLevel,
        service: {
          name: service.name,
          icon: service.icon,
        },
        client: {
          id: client.id,
          name: client.name,
          points: newPoints,
          level: newLevel,
        },
      },
    });
  } catch (error) {
    console.error("validateServiceScan error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du scan",
    });
  }
};
