// controllers/scanController.js

const { Service, Enterprise, Client, NFCCard, Scan, Reward, Redemption } = require("../models");
const { Op } = require("sequelize");

/**
 * Calcule les infos de niveau d'un client (niveau actuel, prochain, progression)
 */
const getLevelInfo = (points) => {
  const levels = [
    { name: "Silver", min: 0, max: 999, next: "Gold", nextMin: 1000 },
    { name: "Gold", min: 1000, max: 4999, next: "Platinum", nextMin: 5000 },
    { name: "Platinum", min: 5000, max: Infinity, next: null, nextMin: null },
  ];
  const current = levels.find((l) => points >= l.min && points <= l.max) || levels[0];
  const progressToNext = current.nextMin
    ? Math.min(100, Math.round(((points - current.min) / (current.nextMin - current.min)) * 100))
    : 100;
  return {
    current: current.name,
    next: current.next,
    nextMin: current.nextMin,
    pointsToNext: current.nextMin ? Math.max(0, current.nextMin - points) : 0,
    progressToNext,
  };
};

/**
 * GET /api/scan/card/:token
 * Récupérer les informations de la carte, le client assigné (si existant) et les services disponibles
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

    // Trouver la carte via le scanToken, inclure le client assigné si présent
    const card = await NFCCard.findOne({
      where: { scanToken: token },
      include: [
        {
          model: Enterprise,
          attributes: ["id", "name", "logo", "location", "phone", "email"],
        },
        {
          model: Client,
          as: "assignedClient",
          attributes: ["id", "name", "email", "phone", "photo", "points", "level"],
          required: false,
        },
      ],
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte introuvable ou lien invalide",
      });
    }

    const enterpriseId = card.enterpriseId;

    // Récupérer tous les services actifs de l'entreprise
    const services = await Service.findAll({
      where: { enterpriseId, isActive: true },
      attributes: ["id", "name", "description", "pointsToAdd", "icon", "color"],
      order: [["createdAt", "ASC"]],
    });

    // Récupérer les récompenses actives de l'entreprise
    const rewards = await Reward.findAll({
      where: { enterpriseId, isActive: true },
      attributes: ["id", "title", "description", "pointsRequired", "image", "category", "stock"],
      order: [["pointsRequired", "ASC"]],
    });

    // Construire la réponse de base
    const responseData = {
      card: {
        id: card.id,
        cardCode: card.cardCode,
        cardNumber: card.cardNumber,
        type: card.type,
        subtype: card.subtype,
        isAssigned: !!card.assignedToClientId,
      },
      enterprise: {
        id: card.Enterprise.id,
        name: card.Enterprise.name,
        logo: card.Enterprise.logo,
        location: card.Enterprise.location,
        phone: card.Enterprise.phone,
      },
      services,
      rewards,
      client: null,
    };

    // Si la carte est assignée à un client, inclure ses données et récompenses accessibles
    if (card.assignedClient) {
      const client = card.assignedClient;
      const levelInfo = getLevelInfo(client.points);

      responseData.client = {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        photo: client.photo,
        points: client.points,
        level: client.level,
        levelInfo,
        availableRewards: rewards
          .filter((r) => client.points >= r.pointsRequired)
          .map((r) => r.id),
      };
    }

    res.json({
      success: true,
      data: responseData,
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
 * POST /api/scan/identify-client
 * Identifier un client via son téléphone ou email pour une entreprise donnée (via scanToken)
 * Route publique — fallback quand la carte n'est pas assignée
 */
exports.identifyClient = async (req, res) => {
  try {
    const { scanToken, phone, email } = req.body;

    if (!scanToken) {
      return res.status(400).json({ success: false, message: "Token manquant" });
    }

    if (!phone && !email) {
      return res.status(400).json({ success: false, message: "Téléphone ou email requis" });
    }

    // Récupérer l'entreprise via le token
    const card = await NFCCard.findOne({
      where: { scanToken },
      attributes: ["id", "enterpriseId"],
    });

    if (!card) {
      return res.status(404).json({ success: false, message: "Carte introuvable" });
    }

    const enterpriseId = card.enterpriseId;

    // Chercher le client par phone ou email dans cette entreprise
    const orConditions = [];
    if (phone) orConditions.push({ phone });
    if (email) orConditions.push({ email });

    const client = await Client.findOne({
      where: { enterpriseId, [Op.or]: orConditions },
      attributes: ["id", "name", "email", "phone", "photo", "points", "level"],
    });

    // Récupérer les récompenses actives pour enrichir la réponse
    const rewards = await Reward.findAll({
      where: { enterpriseId, isActive: true },
      attributes: ["id", "title", "description", "pointsRequired", "image", "category", "stock"],
      order: [["pointsRequired", "ASC"]],
    });

    if (!client) {
      // Nouveau client — retourner les récompenses sans solde
      return res.json({
        success: true,
        data: {
          found: false,
          client: null,
          rewards,
        },
      });
    }

    const levelInfo = getLevelInfo(client.points);

    res.json({
      success: true,
      data: {
        found: true,
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          photo: client.photo,
          points: client.points,
          level: client.level,
          levelInfo,
          availableRewards: rewards
            .filter((r) => client.points >= r.pointsRequired)
            .map((r) => r.id),
        },
        rewards,
      },
    });
  } catch (error) {
    console.error("identifyClient error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'identification du client" });
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
      return res.status(400).json({ success: false, message: "Token manquant" });
    }
    if (!cardCode) {
      return res.status(400).json({ success: false, message: "Code de la carte requis" });
    }
    if (!serviceId) {
      return res.status(400).json({ success: false, message: "Service requis" });
    }

    // 1. Trouver la carte via scanToken ET vérifier le cardCode
    const card = await NFCCard.findOne({
      where: { scanToken, cardCode },
      include: [
        { model: Enterprise },
        { model: Client, as: "assignedClient", required: false },
      ],
    });

    if (!card) {
      return res.status(404).json({ success: false, message: "Carte introuvable ou code invalide" });
    }

    const enterpriseId = card.enterpriseId;

    // 2. Vérifier que le service existe et appartient à cette entreprise
    const service = await Service.findOne({
      where: { id: serviceId, enterpriseId, isActive: true },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service introuvable ou inactif" });
    }

    // 3. Résoudre le client : priorité à assignedClient, sinon phone/email
    let client = card.assignedClient || null;

    if (!client) {
      if (!phone && !email) {
        return res.status(400).json({ success: false, message: "Téléphone ou email requis" });
      }

      const orConditions = [];
      if (phone) orConditions.push({ phone });
      if (email) orConditions.push({ email });

      client = await Client.findOne({
        where: { enterpriseId, [Op.or]: orConditions },
      });

      if (!client) {
        client = await Client.create({
          name: name || "Client",
          email: email || null,
          phone: phone || null,
          enterpriseId,
          points: 0,
          level: "Silver",
        });
      }
    }

    // 4. Créer le scan et ajouter les points
    await Scan.create({
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
    await client.update({ points: newPoints, lastActivity: new Date() });

    // 6. Mettre à jour le niveau
    let newLevel = "Silver";
    if (newPoints >= 5000) newLevel = "Platinum";
    else if (newPoints >= 1000) newLevel = "Gold";
    if (client.level !== newLevel) {
      await client.update({ level: newLevel });
    }

    // 7. Récupérer les récompenses disponibles après le scan
    const rewards = await Reward.findAll({
      where: { enterpriseId, isActive: true },
      attributes: ["id", "title", "description", "pointsRequired", "image", "category", "stock"],
      order: [["pointsRequired", "ASC"]],
    });

    const levelInfo = getLevelInfo(newPoints);

    res.status(201).json({
      success: true,
      message: `+${service.pointsToAdd} points ajoutés !`,
      data: {
        pointsAdded: service.pointsToAdd,
        totalPoints: newPoints,
        level: newLevel,
        levelInfo,
        service: { name: service.name, icon: service.icon },
        client: {
          id: client.id,
          name: client.name,
          points: newPoints,
          level: newLevel,
        },
        rewards,
        availableRewards: rewards.filter((r) => newPoints >= r.pointsRequired).map((r) => r.id),
      },
    });
  } catch (error) {
    console.error("validateServiceScan error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la validation du scan" });
  }
};

/**
 * POST /api/scan/redeem-reward
 * Utiliser une récompense depuis la page scan publique
 * Vérifie le cardCode, les points suffisants, le stock, puis soustrait les points
 */
exports.redeemRewardScan = async (req, res) => {
  try {
    const { scanToken, cardCode, rewardId, clientId } = req.body;

    // ── Validations ──────────────────────────────────────────────────────────
    if (!scanToken) {
      return res.status(400).json({ success: false, message: "Token manquant" });
    }
    if (!cardCode) {
      return res.status(400).json({ success: false, message: "Code de la carte requis" });
    }
    if (!rewardId) {
      return res.status(400).json({ success: false, message: "Récompense requise" });
    }
    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client requis" });
    }

    // ── 1. Vérifier la carte (scanToken + cardCode) ──────────────────────────
    const card = await NFCCard.findOne({
      where: { scanToken, cardCode },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Code de carte invalide",
      });
    }

    const enterpriseId = card.enterpriseId;

    // ── 2. Vérifier que le client appartient à cette entreprise ──────────────
    const client = await Client.findOne({
      where: { id: clientId, enterpriseId },
    });

    if (!client) {
      return res.status(404).json({ success: false, message: "Client introuvable" });
    }

    // ── 3. Vérifier la récompense ─────────────────────────────────────────────
    const reward = await Reward.findOne({
      where: { id: rewardId, enterpriseId, isActive: true },
    });

    if (!reward) {
      return res.status(404).json({ success: false, message: "Récompense introuvable ou inactive" });
    }

    // ── 4. Vérifier les points suffisants ─────────────────────────────────────
    if (client.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `Points insuffisants. Vous avez ${client.points} pts, il faut ${reward.pointsRequired} pts.`,
      });
    }

    // ── 5. Vérifier le stock ──────────────────────────────────────────────────
    if (reward.stock !== null && reward.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cette récompense n'est plus disponible en stock",
      });
    }

    // ── 6. Créer le Redemption ────────────────────────────────────────────────
    const redemption = await Redemption.create({
      clientId: client.id,
      enterpriseId,
      rewardId: reward.id,
      pointsUsed: reward.pointsRequired,
      status: "approved",
      notes: `Échange via scan carte ${card.cardCode}`,
    });

    // ── 7. Créer un Scan (historique — points négatifs) ───────────────────────
    await Scan.create({
      cardId: card.id,
      clientId: client.id,
      enterpriseId,
      serviceId: null,
      pointsAdded: -reward.pointsRequired,
      notes: `Utilisation récompense : ${reward.title} (via carte ${card.cardCode})`,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    // ── 7. Déduire les points ─────────────────────────────────────────────────
    const newPoints = client.points - reward.pointsRequired;
    await client.update({ points: newPoints, lastActivity: new Date() });

    // ── 8. Mettre à jour le niveau ────────────────────────────────────────────
    let newLevel = "Silver";
    if (newPoints >= 5000) newLevel = "Platinum";
    else if (newPoints >= 1000) newLevel = "Gold";
    if (client.level !== newLevel) {
      await client.update({ level: newLevel });
    }

    // ── 9. Décrémenter le stock si applicable ─────────────────────────────────
    if (reward.stock !== null) {
      await reward.update({ stock: reward.stock - 1 });
    }

    // ── 10. Retourner le résultat avec solde mis à jour ───────────────────────
    const updatedRewards = await Reward.findAll({
      where: { enterpriseId, isActive: true },
      attributes: ["id", "title", "description", "pointsRequired", "image", "category", "stock"],
      order: [["pointsRequired", "ASC"]],
    });

    const levelInfo = getLevelInfo(newPoints);

    res.status(201).json({
      success: true,
      message: `Récompense "${reward.title}" utilisée avec succès !`,
      data: {
        redemptionId: redemption.id,
        pointsUsed: reward.pointsRequired,
        reward: {
          id: reward.id,
          title: reward.title,
          description: reward.description,
          image: reward.image,
        },
        client: {
          id: client.id,
          name: client.name,
          points: newPoints,
          level: newLevel,
          levelInfo,
        },
        rewards: updatedRewards,
        availableRewards: updatedRewards.filter((r) => newPoints >= r.pointsRequired).map((r) => r.id),
      },
    });
  } catch (error) {
    console.error("redeemRewardScan error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'utilisation de la récompense" });
  }
};
