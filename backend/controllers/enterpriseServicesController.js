const { Enterprise, Service, Reward, Redemption, Client, Scan } = require("../models");

/**
 * GET /api/enterprise/services
 * Récupérer tous les services de l'entreprise connectée
 */
exports.getServices = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const services = await Service.findAll({
      where: { enterpriseId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
    });
  }
};

/**
 * POST /api/enterprise/services
 * Créer un nouveau service pour l'entreprise connectée
 */
exports.createService = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const { name, description, pointsToAdd, icon, color, isActive } = req.body;

    if (!name || pointsToAdd === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nom et points à ajouter sont obligatoires",
      });
    }

    const service = await Service.create({
      name,
      description: description || null,
      pointsToAdd,
      icon: icon || null,
      color: color || "#6A35FF",
      isActive: isActive !== undefined ? isActive : true,
      enterpriseId,
    });

    res.status(201).json({
      success: true,
      message: "Service créé avec succès",
      data: service,
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du service",
    });
  }
};

/**
 * PUT /api/enterprise/services/:id
 * Mettre à jour un service
 */
exports.updateService = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const service = await Service.findOne({ where: { id, enterpriseId } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service introuvable",
      });
    }

    const { name, description, pointsToAdd, icon, color, isActive } = req.body;

    await service.update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(pointsToAdd !== undefined && { pointsToAdd }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(isActive !== undefined && { isActive }),
    });

    res.json({
      success: true,
      message: "Service mis à jour avec succès",
      data: service,
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du service",
    });
  }
};

/**
 * DELETE /api/enterprise/services/:id
 * Supprimer un service
 */
exports.deleteService = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const service = await Service.findOne({ where: { id, enterpriseId } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service introuvable",
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: "Service supprimé avec succès",
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du service",
    });
  }
};

/**
 * GET /api/enterprise/rewards
 * Récupérer toutes les récompenses de l'entreprise connectée
 */
exports.getRewards = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const rewards = await Reward.findAll({
      where: { enterpriseId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error("Get rewards error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des récompenses",
    });
  }
};

/**
 * POST /api/enterprise/rewards
 * Créer une nouvelle récompense pour l'entreprise connectée
 */
exports.createReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const { title, description, pointsRequired, image, category, isActive, stock } = req.body;

    if (!title || pointsRequired === undefined) {
      return res.status(400).json({
        success: false,
        message: "Titre et points requis sont obligatoires",
      });
    }

    const reward = await Reward.create({
      title,
      description: description || null,
      pointsRequired,
      image: image || null,
      category: category || "general",
      isActive: isActive !== undefined ? isActive : true,
      stock: stock || null,
      enterpriseId,
    });

    res.status(201).json({
      success: true,
      message: "Récompense créée avec succès",
      data: reward,
    });
  } catch (error) {
    console.error("Create reward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la récompense",
    });
  }
};

/**
 * PUT /api/enterprise/rewards/:id
 * Mettre à jour une récompense
 */
exports.updateReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const reward = await Reward.findOne({ where: { id, enterpriseId } });
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Récompense introuvable",
      });
    }

    const { title, description, pointsRequired, image, category, isActive, stock } = req.body;

    await reward.update({
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(pointsRequired !== undefined && { pointsRequired }),
      ...(image !== undefined && { image }),
      ...(category !== undefined && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(stock !== undefined && { stock }),
    });

    res.json({
      success: true,
      message: "Récompense mise à jour avec succès",
      data: reward,
    });
  } catch (error) {
    console.error("Update reward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la récompense",
    });
  }
};

/**
 * DELETE /api/enterprise/rewards/:id
 * Supprimer une récompense
 */
exports.deleteReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const reward = await Reward.findOne({ where: { id, enterpriseId } });
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Récompense introuvable",
      });
    }

    await reward.destroy();

    res.json({
      success: true,
      message: "Récompense supprimée avec succès",
    });
  } catch (error) {
    console.error("Delete reward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la récompense",
    });
  }
};

/**
 * POST /api/enterprise/rewards/:rewardId/redeem/:clientId
 * Permettre à l'entreprise de valider un échange de récompense
 */
exports.redeemReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { rewardId, clientId } = req.params;

    const reward = await Reward.findOne({ where: { id: rewardId, enterpriseId } });
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Récompense introuvable",
      });
    }

    const client = await Client.findOne({ where: { id: clientId, enterpriseId } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client introuvable",
      });
    }

    if (client.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: "Points insuffisants pour échanger cette récompense",
      });
    }

    if (reward.stock !== null && reward.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cette récompense n'est plus disponible en stock",
      });
    }

    // Créer l'échange
    const redemption = await Redemption.create({
      clientId,
      enterpriseId,
      rewardId,
      pointsUsed: reward.pointsRequired,
      status: "approved",
    });

    // Déduire les points du client
    await client.update({
      points: client.points - reward.pointsRequired,
    });

    // Déduire du stock si applicable
    if (reward.stock !== null) {
      await reward.update({
        stock: reward.stock - 1,
      });
    }

    res.status(201).json({
      success: true,
      message: "Récompense échangée avec succès",
      data: { redemption, client },
    });
  } catch (error) {
    console.error("Redeem reward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'échange de la récompense",
    });
  }
};

/**
 * GET /api/enterprise/redemptions
 * Récupérer tous les échanges de récompenses de l'entreprise connectée
 */
exports.getRedemptions = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const redemptions = await Redemption.findAll({
      where: { enterpriseId },
      include: [
        { model: Client, attributes: ["id", "name"] },
        { model: Reward, attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    console.error("Get redemptions error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des échanges",
    });
  }
};

/**
 * POST /api/enterprise/scans
 * Créer un scan avec service et ajouter des points au client
 */
exports.createScan = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { cardId, serviceId, notes } = req.body;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: "ID de carte est obligatoire",
      });
    }

    const card = await NFCCard.findOne({
      where: { id: cardId, enterpriseId },
      include: [Client],
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte NFC introuvable",
      });
    }

    if (!card.assignedClient) {
      return res.status(400).json({
        success: false,
        message: "Cette carte n'est pas assignée à un client",
      });
    }

    let pointsToAdd = 0;
    if (serviceId) {
      const service = await Service.findOne({ where: { id: serviceId, enterpriseId, isActive: true } });
      if (service) {
        pointsToAdd = service.pointsToAdd;
      }
    }

    // Créer le scan
    const scan = await Scan.create({
      cardId,
      clientId: card.assignedClientId,
      enterpriseId,
      serviceId: serviceId || null,
      pointsAdded: pointsToAdd,
      notes: notes || null,
      userAgent: req.get("User-Agent") || null,
      ipAddress: req.ip || null,
    });

    // Mettre à jour les points du client
    if (pointsToAdd > 0) {
      await card.assignedClient.update({
        points: card.assignedClient.points + pointsToAdd,
      });
    }

    res.status(201).json({
      success: true,
      message: "Scan enregistré avec succès",
      data: {
        scan,
        client: card.assignedClient,
      },
    });
  } catch (error) {
    console.error("Create scan error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du scan",
    });
  }
};
