// controllers/enterpriseController.js

const { Enterprise, NFCCard, Client, Scan, Service, Reward, Redemption, User } = require("../models");
const { Op } = require("sequelize");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Met à jour le niveau d'un client selon ses points
 * Silver: 0-999 points
 * Gold: 1000-4999 points
 * Platinum: 5000+ points
 */
const updateClientLevel = async (client) => {
  let newLevel = "Silver";
  if (client.points >= 5000) {
    newLevel = "Platinum";
  } else if (client.points >= 1000) {
    newLevel = "Gold";
  }

  if (client.level !== newLevel) {
    await client.update({ level: newLevel });
  }
};

// ─────────────────────────────────────────────────────────────
// ENTERPRISE (ME)
// ─────────────────────────────────────────────────────────────

exports.getMyEnterprise = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    // Récupérer les stats pour le dashboard
    const [totalCards, activeCards, totalClients, totalScansThisMonth] = await Promise.all([
      NFCCard.count({ where: { enterpriseId } }),
      NFCCard.count({ where: { enterpriseId, status: "active" } }),
      Client.count({ where: { enterpriseId } }),
      Scan.count({
        where: {
          enterpriseId,
          createdAt: { [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...enterprise.toJSON(),
        stats: {
          totalCards,
          activeCards,
          totalClients,
          totalScansThisMonth,
        },
      },
    });
  } catch (error) {
    console.error("getMyEnterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'entreprise",
    });
  }
};

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
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    const { name, phone, location, logo, adminFirstName, adminLastName } = req.body;
    await enterprise.update({
      name: name || enterprise.name,
      phone: phone || enterprise.phone,
      location: location || enterprise.location,
      logo: logo || enterprise.logo,
      adminFirstName: adminFirstName || enterprise.adminFirstName,
      adminLastName: adminLastName || enterprise.adminLastName,
    });

    // Mettre à jour l'utilisateur connecté (OWNER) si adminFirstName/adminLastName changent
    if (adminFirstName || adminLastName) {
      const user = await User.findByPk(req.user.id);
      if (user) {
        await user.update({
          firstName: adminFirstName || user.firstName,
          lastName: adminLastName || user.lastName,
        });
      }
    }

    res.json({
      success: true,
      message: "Entreprise mise à jour avec succès",
      data: enterprise,
    });
  } catch (error) {
    console.error("updateMyEnterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'entreprise",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────

exports.getClients = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { enterpriseId };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("getClients error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des clients",
    });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const client = await Client.findOne({
      where: { id, enterpriseId },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    // Récupérer les scans du client
    const scans = await Scan.findAll({
      where: { clientId: id },
      include: [Service, NFCCard],
      order: [["scannedAt", "DESC"]],
      limit: 20,
    });

    res.json({
      success: true,
      data: { ...client.toJSON(), scans },
    });
  } catch (error) {
    console.error("getClientById error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du client",
    });
  }
};

exports.createClient = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { name, email, phone, photo } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Le nom du client est requis",
      });
    }

    const client = await Client.create({
      name,
      email: email || null,
      phone: phone || null,
      photo: photo || null,
      enterpriseId,
      points: 0,
      level: "Silver",
    });

    res.status(201).json({
      success: true,
      message: "Client créé avec succès",
      data: client,
    });
  } catch (error) {
    console.error("createClient error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du client",
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;
    const { name, email, phone, photo, status, level } = req.body;

    const client = await Client.findOne({ where: { id, enterpriseId } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    await client.update({
      name: name || client.name,
      email: email !== undefined ? email : client.email,
      phone: phone !== undefined ? phone : client.phone,
      photo: photo !== undefined ? photo : client.photo,
      status: status || client.status,
      level: level || client.level,
    });

    res.json({
      success: true,
      message: "Client mis à jour avec succès",
      data: client,
    });
  } catch (error) {
    console.error("updateClient error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du client",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────

exports.getServices = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { activeOnly } = req.query;

    const where = { enterpriseId };
    if (activeOnly === "true") {
      where.isActive = true;
    }

    const services = await Service.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("getServices error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
    });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const service = await Service.findOne({
      where: { id, enterpriseId },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("getServiceById error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du service",
    });
  }
};

exports.createService = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { name, description, pointsToAdd, icon, color, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Le nom du service est requis",
      });
    }

    const service = await Service.create({
      name,
      description: description || null,
      pointsToAdd: pointsToAdd !== undefined ? parseInt(pointsToAdd) : 10,
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
    console.error("createService error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du service",
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;
    const { name, description, pointsToAdd, icon, color, isActive } = req.body;

    const service = await Service.findOne({ where: { id, enterpriseId } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé",
      });
    }

    await service.update({
      name: name || service.name,
      description: description !== undefined ? description : service.description,
      pointsToAdd: pointsToAdd !== undefined ? parseInt(pointsToAdd) : service.pointsToAdd,
      icon: icon !== undefined ? icon : service.icon,
      color: color || service.color,
      isActive: isActive !== undefined ? isActive : service.isActive,
    });

    res.json({
      success: true,
      message: "Service mis à jour avec succès",
      data: service,
    });
  } catch (error) {
    console.error("updateService error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du service",
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const service = await Service.findOne({ where: { id, enterpriseId } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé",
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: "Service supprimé avec succès",
    });
  } catch (error) {
    console.error("deleteService error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du service",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// REWARDS
// ─────────────────────────────────────────────────────────────

exports.getRewards = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { activeOnly } = req.query;

    const where = { enterpriseId };
    if (activeOnly === "true") {
      where.isActive = true;
    }

    const rewards = await Reward.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error("getRewards error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des récompenses",
    });
  }
};

exports.getRewardById = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const reward = await Reward.findOne({
      where: { id, enterpriseId },
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Récompense non trouvée",
      });
    }

    res.json({
      success: true,
      data: reward,
    });
  } catch (error) {
    console.error("getRewardById error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la récompense",
    });
  }
};

exports.createReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { title, description, pointsRequired, image, category, isActive, stock } = req.body;

    if (!title || !pointsRequired) {
      return res.status(400).json({
        success: false,
        message: "Le titre et les points requis sont obligatoires",
      });
    }

    const reward = await Reward.create({
      title,
      description: description || null,
      pointsRequired: parseInt(pointsRequired),
      image: image || null,
      category: category || "general",
      isActive: isActive !== undefined ? isActive : true,
      stock: stock !== undefined ? parseInt(stock) : null,
      enterpriseId,
    });

    res.status(201).json({
      success: true,
      message: "Récompense créée avec succès",
      data: reward,
    });
  } catch (error) {
    console.error("createReward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la récompense",
    });
  }
};

exports.updateReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;
    const { title, description, pointsRequired, image, category, isActive, stock } = req.body;

    const reward = await Reward.findOne({ where: { id, enterpriseId } });
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Récompense non trouvée",
      });
    }

    await reward.update({
      title: title || reward.title,
      description: description !== undefined ? description : reward.description,
      pointsRequired: pointsRequired !== undefined ? parseInt(pointsRequired) : reward.pointsRequired,
      image: image !== undefined ? image : reward.image,
      category: category || reward.category,
      isActive: isActive !== undefined ? isActive : reward.isActive,
      stock: stock !== undefined ? (stock !== null ? parseInt(stock) : null) : reward.stock,
    });

    res.json({
      success: true,
      message: "Récompense mise à jour avec succès",
      data: reward,
    });
  } catch (error) {
    console.error("updateReward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la récompense",
    });
  }
};

exports.deleteReward = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;

    const reward = await Reward.findOne({ where: { id, enterpriseId } });
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Récompense non trouvée",
      });
    }

    await reward.destroy();

    res.json({
      success: true,
      message: "Récompense supprimée avec succès",
    });
  } catch (error) {
    console.error("deleteReward error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la récompense",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────────────────────

exports.getCards = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { enterpriseId };
    if (status) {
      where.status = status;
    }

    const { count, rows } = await NFCCard.findAndCountAll({
      where,
      include: [
        { model: Client, as: "assignedClient", attributes: ["id", "name", "email"] },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("getCards error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cartes",
    });
  }
};

exports.assignCard = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { id } = req.params;
    const { clientId } = req.body;

    const card = await NFCCard.findOne({ where: { id, enterpriseId } });
    if (!card) {
      return res.status(404).json({ success: false, message: "Carte non trouvée" });
    }

    if (clientId) {
      const client = await Client.findOne({ where: { id: clientId, enterpriseId } });
      if (!client) {
        return res.status(404).json({ success: false, message: "Client non trouvé" });
      }
      await card.update({ assignedToClientId: clientId, assignedAt: new Date(), status: "active" });
    } else {
      // Désassigner
      await card.update({ assignedToClientId: null, assignedAt: null, status: "unassigned" });
    }

    const updated = await NFCCard.findByPk(id, {
      include: [{ model: Client, as: "assignedClient", attributes: ["id", "name", "email"] }],
    });

    res.json({ success: true, message: clientId ? "Carte attribuée avec succès" : "Carte désattribuée", data: updated });
  } catch (error) {
    console.error("assignCard error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'attribution de la carte" });
  }
};

// ─────────────────────────────────────────────────────────────
// SCANS & POINTS
// ─────────────────────────────────────────────────────────────

exports.scanCard = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { cardCode, serviceId, notes, manualPoints } = req.body;

    // 1. Trouver la carte
    const card = await NFCCard.findOne({
      where: { cardCode, enterpriseId },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte non trouvée",
      });
    }

    if (card.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Carte inactive",
      });
    }

    if (card.status === "unassigned" || !card.assignedToClientId) {
      return res.status(400).json({
        success: false,
        message: "Carte non attribuée à un client",
      });
    }

    // 2. Trouver le client
    const client = await Client.findByPk(card.assignedToClientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client associé à la carte non trouvé",
      });
    }

    // 3. Déterminer les points à ajouter
    let pointsToAdd = 0;
    if (manualPoints !== undefined) {
      pointsToAdd = parseInt(manualPoints);
    } else if (serviceId) {
      const service = await Service.findByPk(serviceId);
      if (service && service.enterpriseId === enterpriseId && service.isActive) {
        pointsToAdd = service.pointsToAdd;
      }
    }

    // 4. Créer le scan
    const scan = await Scan.create({
      cardId: card.id,
      clientId: client.id,
      enterpriseId,
      serviceId: serviceId || null,
      pointsAdded: pointsToAdd,
      notes: notes || null,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    // 5. Mettre à jour les points du client
    if (pointsToAdd !== 0) {
      await client.update({ points: client.points + pointsToAdd });
      await updateClientLevel(client);
    }

    // 6. Mettre à jour lastActivity du client
    await client.update({ lastActivity: new Date() });

    // Récupérer les données complètes pour la réponse
    const fullScan = await Scan.findByPk(scan.id, {
      include: [Client, Service, NFCCard],
    });

    res.status(201).json({
      success: true,
      message: pointsToAdd > 0 ? `${pointsToAdd} points ajoutés avec succès` : "Scan enregistré",
      data: fullScan,
    });
  } catch (error) {
    console.error("scanCard error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du scan de la carte",
    });
  }
};

exports.getScans = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { page = 1, limit = 20, clientId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { enterpriseId };
    if (clientId) {
      where.clientId = clientId;
    }
    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) {
        where.scannedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.scannedAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await Scan.findAndCountAll({
      where,
      include: [Client, Service, NFCCard],
      limit: parseInt(limit),
      offset,
      order: [["scannedAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("getScans error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des scans",
    });
  }
};

exports.adjustPoints = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;
    const { clientId, points, reason } = req.body;

    if (!clientId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: "clientId et points sont requis",
      });
    }

    const client = await Client.findOne({
      where: { id: clientId, enterpriseId },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    // Calculer les nouveaux points
    const newPoints = client.points + parseInt(points);
    if (newPoints < 0) {
      return res.status(400).json({
        success: false,
        message: "Le solde de points ne peut pas être négatif",
      });
    }

    // Mettre à jour le client
    await client.update({ points: newPoints });
    await updateClientLevel(client);
    await client.update({ lastActivity: new Date() });

    // Créer un scan (pour l'historique)
    await Scan.create({
      cardId: null,
      clientId: client.id,
      enterpriseId,
      serviceId: null,
      pointsAdded: parseInt(points),
      notes: reason || (points > 0 ? "Ajout manuel de points" : "Retrait manuel de points"),
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    });

    res.json({
      success: true,
      message: `Points ${points > 0 ? "ajoutés" : "retirés"} avec succès`,
      data: client,
    });
  } catch (error) {
    console.error("adjustPoints error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajustement des points",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD ENTERPRISE
// ─────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const enterpriseId = req.user.enterpriseId;

    // Statistiques générales
    const [
      totalClients,
      totalCards,
      activeCards,
      totalScans,
      totalPointsGiven,
    ] = await Promise.all([
      Client.count({ where: { enterpriseId } }),
      NFCCard.count({ where: { enterpriseId } }),
      NFCCard.count({ where: { enterpriseId, status: "active" } }),
      Scan.count({ where: { enterpriseId } }),
      Scan.sum("pointsAdded", { where: { enterpriseId } }),
    ]);

    // Scans des 7 derniers jours
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const scanStats = await Scan.findAll({
      attributes: [
        [require("sequelize").fn("DATE", require("sequelize").col("scannedAt")), "day"],
        [require("sequelize").fn("COUNT", require("sequelize").col("id")), "scans"],
      ],
      where: {
        enterpriseId,
        scannedAt: { [Op.gte]: sevenDaysAgo },
      },
      group: [require("sequelize").fn("DATE", require("sequelize").col("scannedAt"))],
      order: [[require("sequelize").fn("DATE", require("sequelize").col("scannedAt")), "ASC"]],
      raw: true,
    });

    // Top 5 clients par points
    const topClients = await Client.findAll({
      where: { enterpriseId },
      order: [["points", "DESC"]],
      limit: 5,
    });

    // Derniers scans
    const recentScans = await Scan.findAll({
      where: { enterpriseId },
      include: [Client, Service, NFCCard],
      order: [["scannedAt", "DESC"]],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalClients,
          totalCards,
          activeCards,
          totalScans,
          totalPointsGiven: totalPointsGiven || 0,
        },
        scanStats,
        topClients,
        recentScans,
      },
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du dashboard",
    });
  }
};
