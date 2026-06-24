// controllers/adminController.js

const {
  Enterprise,
  NFCCard,
  Client,
  Scan,
  Subscription,
  User,
  Role,
  Setting,
} = require("../models");
const { Op } = require("sequelize");

/**
 * GET /api/admin/dashboard
 * Dashboard stats pour le super admin
 */
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Entreprises actives
    const activeEnterprises = await Enterprise.count({
      where: { status: "active" },
    });

    // 2. Total cartes générées
    const totalCards = await NFCCard.count();

    // 3. Scans ce mois
    const scansThisMonth = await Scan.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    // 4. Revenus mensuels (estimé via subscriptions actives)
    const monthlyRevenue = await Subscription.sum("monthlyPrice", {
      where: { status: "active" },
    });

    // 5. Scans des 7 derniers jours (groupé par jour)
    const scanStats = await Scan.findAll({
      attributes: [
        [require("sequelize").fn("DATE", require("sequelize").col("createdAt")), "day"],
        [require("sequelize").fn("COUNT", require("sequelize").col("id")), "scans"],
      ],
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      group: [require("sequelize").fn("DATE", require("sequelize").col("createdAt"))],
      order: [[require("sequelize").fn("DATE", require("sequelize").col("createdAt")), "ASC"]],
      raw: true,
    });

    // Format scan stats with day names
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const scanTrends = scanStats.map((stat) => {
      const date = new Date(stat.day);
      return {
        day: dayNames[date.getDay()],
        scans: parseInt(stat.scans) || 0,
      };
    });

    // 6. Cartes par statut
    const cardStatusRaw = await NFCCard.findAll({
      attributes: [
        "status",
        [require("sequelize").fn("COUNT", require("sequelize").col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Format card status data
    const statusColorMap = {
      active: '#6A35FF',
      inactive: '#BC43FF',
      unassigned: '#F4C8E8',
    };
    const statusLabelMap = {
      active: 'Actives',
      inactive: 'Inactives',
      unassigned: 'Non attribuées',
    };
    const cardStatusBreakdown = cardStatusRaw.map((item) => ({
      name: statusLabelMap[item.status] || item.status,
      value: parseInt(item.count) || 0,
      color: statusColorMap[item.status] || '#999999',
    }));

    // 7. Derniers scans
    const recentScans = await Scan.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        { model: Client, attributes: ["name"] },
        { model: Enterprise, attributes: ["name"] },
      ],
      raw: true,
    });

    // Transform recent scans to match frontend format
    const formattedRecentScans = recentScans.map((scan) => ({
      id: scan.id,
      clientName: scan["Client.name"] || "Unknown",
      enterpriseName: scan["Enterprise.name"] || "Unknown",
      action: scan.pointsAdded ? `+${scan.pointsAdded} points` : "Consultation",
      points: scan.pointsAdded || 0,
      timestamp: scan.createdAt,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          activeEnterprises,
          totalCards,
          scansThisMonth,
          monthlyRevenue: monthlyRevenue || 0,
        },
        scanTrends,
        cardStatusBreakdown,
        recentScans: formattedRecentScans,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du dashboard",
    });
  }
};

/**
 * GET /api/admin/enterprises
 * Liste toutes les entreprises avec pagination
 */
exports.getEnterprises = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const where = {};

    // Filtre par statut
    if (status && status !== "all") {
      where.status = status;
    }

    // Filtre recherche sur nom ou email
    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const { count, rows } = await Enterprise.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Subscription,
          attributes: ["plan", "status"],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get enterprises error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des entreprises",
    });
  }
};

/**
 * GET /api/admin/enterprises/:id
 * Détails d'une entreprise
 */
exports.getEnterpriseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findByPk(id, {
      include: [
        {
          model: Subscription,
        },
        {
          model: NFCCard,
          attributes: ["id", "status", "cardNumber"],
        },
        {
          model: Client,
          attributes: ["id", "name"],
        },
        {
          model: Scan,
          attributes: ["id", "createdAt", "pointsAdded"],
          order: [["createdAt", "DESC"]],
          limit: 10,
        },
      ],
    });

    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    res.json({
      success: true,
      data: {
        ...enterprise.toJSON(),
        totalCards: enterprise.NFCCards.length,
        totalClients: enterprise.Clients.length,
        totalScans: enterprise.Scans.length,
        activeCards: enterprise.NFCCards.filter((c) => c.status === "active")
          .length,
      },
    });
  } catch (error) {
    console.error("Get enterprise detail error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'entreprise",
    });
  }
};

/**
 * GET /api/admin/cards
 * Liste toutes les cartes NFC avec pagination
 */
exports.getCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status, enterpriseId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const { count, rows } = await NFCCard.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        { model: Enterprise, attributes: ["name"] },
        { model: Client, as: "assignedClient", attributes: ["name"] },
      ],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cartes",
    });
  }
};

/**
 * GET /api/admin/scans
 * Liste les scans avec pagination
 */
exports.getScans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { enterpriseId, search } = req.query;

    const where = {};
    if (enterpriseId) where.enterpriseId = enterpriseId;

    // Filtre recherche par nom de client ou numéro de carte
    const clientWhere = {};
    const cardWhere = {};
    if (search && search.trim()) {
      clientWhere.name = { [Op.iLike]: `%${search.trim()}%` };
    }

    const { count, rows } = await Scan.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Client,
          attributes: ["name"],
          ...(search && search.trim() ? { where: clientWhere, required: true } : {}),
        },
        { model: Enterprise, attributes: ["name"] },
        { model: NFCCard, attributes: ["cardNumber"] },
      ],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get scans error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des scans",
    });
  }
};

/**
 * POST /api/admin/enterprises
 * Créer une nouvelle entreprise
 */
exports.createEnterprise = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      adminFirstName,
      adminLastName,
      subscription,
      logo,
    } = req.body;

    // Validation basique
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nom et email sont requis",
      });
    }

    // Vérifier si entreprise existe déjà
    const existingEnterprise = await Enterprise.findOne({
      where: { email },
    });

    if (existingEnterprise) {
      return res.status(409).json({
        success: false,
        message: "Une entreprise avec cet email existe déjà",
      });
    }

    // Créer entreprise
    const enterprise = await Enterprise.create({
      name,
      email,
      phone,
      location,
      adminFirstName,
      adminLastName,
      subscription: subscription || "Starter",
      logo,
      createdBy: req.user?.id, // Supposer que le user est attaché au req
    });

    // Créer subscription automatique
    await Subscription.create({
      enterpriseId: enterprise.id,
      plan: subscription || "Starter",
      monthlyPrice: subscription === "Pro" ? 99 : subscription === "Enterprise" ? 299 : 29,
    });

    res.status(201).json({
      success: true,
      message: "Entreprise créée avec succès",
      data: { enterprise },
    });
  } catch (error) {
    console.error("Create enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'entreprise",
    });
  }
};

/**
 * PUT /api/admin/enterprises/:id
 * Mettre à jour une entreprise
 */
exports.updateEnterprise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, status, subscription, logo } = req.body;

    const enterprise = await Enterprise.findByPk(id);

    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    // Mettre à jour
    await enterprise.update({
      name: name || enterprise.name,
      email: email || enterprise.email,
      phone: phone || enterprise.phone,
      location: location || enterprise.location,
      status: status || enterprise.status,
      logo: logo || enterprise.logo,
    });

    // Mettre à jour subscription si changée
    if (subscription && subscription !== enterprise.subscription) {
      await Subscription.update(
        {
          plan: subscription,
          monthlyPrice:
            subscription === "Pro"
              ? 99
              : subscription === "Enterprise"
              ? 299
              : 29,
        },
        { where: { enterpriseId: id } }
      );

      enterprise.subscription = subscription;
      await enterprise.save();
    }

    res.json({
      success: true,
      message: "Entreprise mise à jour avec succès",
      data: { enterprise },
    });
  } catch (error) {
    console.error("Update enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'entreprise",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// CARTES NFC
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/cards/generate
 * Générer des cartes NFC en masse pour une entreprise
 */
exports.generateCards = async (req, res) => {
  try {
    const { enterpriseId, type, prefix, quantity } = req.body;

    if (!enterpriseId || !type || !prefix || !quantity) {
      return res.status(400).json({
        success: false,
        message: "enterpriseId, type, prefix et quantity sont requis",
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      return res.status(400).json({
        success: false,
        message: "La quantité doit être entre 1 et 1000",
      });
    }

    const enterprise = await Enterprise.findByPk(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    // Générer les cartes en batch
    const cards = [];
    for (let i = 0; i < qty; i++) {
      // Code unique : 8 caractères alphanumériques
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const suffix = String(i + 1).padStart(4, "0");
      cards.push({
        cardNumber: `${prefix}${suffix}`,
        cardCode: code,
        enterpriseId,
        type,
        status: "unassigned",
      });
    }

    const created = await NFCCard.bulkCreate(cards, {
      ignoreDuplicates: true,
    });

    // Mettre à jour le compteur de cartes de l'entreprise
    await Enterprise.increment("cardsCount", {
      by: created.length,
      where: { id: enterpriseId },
    });

    res.status(201).json({
      success: true,
      message: `${created.length} carte(s) générée(s) avec succès`,
      data: { generated: created.length },
    });
  } catch (error) {
    console.error("Generate cards error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération des cartes",
    });
  }
};

/**
 * POST /api/admin/cards/assign
 * Attribuer une carte NFC à un client
 */
exports.assignCard = async (req, res) => {
  try {
    const { cardNumber, clientName, email, phone, level, enterpriseId } = req.body;

    if (!cardNumber || !clientName || !enterpriseId) {
      return res.status(400).json({
        success: false,
        message: "cardNumber, clientName et enterpriseId sont requis",
      });
    }

    // Vérifier que la carte existe et est non attribuée
    const card = await NFCCard.findOne({
      where: { cardNumber, status: "unassigned" },
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Carte introuvable ou déjà attribuée",
      });
    }

    // Créer le client
    const client = await Client.create({
      name: clientName,
      email: email || null,
      phone: phone || null,
      level: level || "Silver",
      enterpriseId,
    });

    // Attribuer la carte
    await card.update({
      assignedToClientId: client.id,
      status: "active",
      assignedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Carte attribuée avec succès",
      data: { client, card },
    });
  } catch (error) {
    console.error("Assign card error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'attribution de la carte",
    });
  }
};

/**
 * GET /api/admin/cards/unassigned
 * Liste les cartes non attribuées (pour le formulaire d'attribution)
 */
exports.getUnassignedCards = async (req, res) => {
  try {
    const { enterpriseId } = req.query;

    const where = { status: "unassigned" };
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const cards = await NFCCard.findAll({
      where,
      include: [{ model: Enterprise, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    console.error("Get unassigned cards error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cartes",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// ABONNEMENTS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/subscriptions
 * Liste tous les abonnements avec infos entreprise
 */
exports.getSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { plan, status } = req.query;

    const where = {};
    if (plan && plan !== "all") where.plan = plan;
    if (status && status !== "all") where.status = status;

    const { count, rows } = await Subscription.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Enterprise,
          attributes: ["id", "name", "email", "logo", "status"],
        },
      ],
    });

    // Statistiques globales
    const totalRevenue = await Subscription.sum("monthlyPrice", {
      where: { status: "active" },
    });

    const countByPlan = await Subscription.findAll({
      attributes: [
        "plan",
        [require("sequelize").fn("COUNT", require("sequelize").col("id")), "count"],
      ],
      group: ["plan"],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
        stats: {
          totalRevenue: totalRevenue || 0,
          countByPlan,
        },
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des abonnements",
    });
  }
};

/**
 * PUT /api/admin/subscriptions/:id
 * Mettre à jour un abonnement (plan, statut)
 */
exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status } = req.body;

    const subscription = await Subscription.findByPk(id, {
      include: [{ model: Enterprise }],
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Abonnement non trouvé",
      });
    }

    const planPrices = { Starter: 29, Pro: 99, Enterprise: 299 };

    await subscription.update({
      ...(plan && { plan, monthlyPrice: planPrices[plan] || subscription.monthlyPrice }),
      ...(status && { status }),
    });

    // Sync plan sur l'entreprise aussi
    if (plan) {
      await Enterprise.update(
        { subscription: plan },
        { where: { id: subscription.enterpriseId } }
      );
    }

    res.json({
      success: true,
      message: "Abonnement mis à jour",
      data: { subscription },
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'abonnement",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UTILISATEURS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Liste tous les utilisateurs de la plateforme
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;

    const where = {};
    if (search && search.trim()) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search.trim()}%` } },
        { lastName: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PARAMÈTRES PLATEFORME
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/settings
 * Retourne tous les paramètres de la plateforme groupés
 */
exports.getSettings = async (req, res) => {
  try {
    const rows = await Setting.findAll({
      order: [["group", "ASC"], ["key", "ASC"]],
    });

    // Grouper par `group`
    const grouped = rows.reduce((acc, setting) => {
      const g = setting.group || "general";
      if (!acc[g]) acc[g] = [];
      acc[g].push({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        label: setting.label,
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paramètres",
    });
  }
};

/**
 * PUT /api/admin/settings
 * Met à jour un ou plusieurs paramètres
 * Body : { settings: { key: value, ... } }
 */
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Le corps de la requête doit contenir un objet 'settings'",
      });
    }

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      const [setting] = await Setting.findOrCreate({
        where: { key },
        defaults: { key, value: String(value) },
      });

      if (setting.value !== String(value)) {
        await setting.update({ value: String(value) });
      }

      updates.push({ key, value: String(value) });
    }

    res.json({
      success: true,
      message: "Paramètres mis à jour avec succès",
      data: { updated: updates.length },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des paramètres",
    });
  }
};
