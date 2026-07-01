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
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");


/**
 * 
 * @param {*} str - Chaîne de caractère(s) à normaliser
 * @returns - slug de la chaîne de caractère(s) passée.
 */
const slugify = (str) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').toLowerCase();

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
        { model: Enterprise, attributes: ["id", "name"] },
        { model: Client, as: "assignedClient", attributes: ["id", "name"] },
      ],
      raw: true,
      nest: true,
    });

    // Aplatir pour le frontend
    const mapped = rows.map((card) => ({
      id: card.id,
      cardNumber: card.cardNumber,
      number: card.cardNumber,
      type: card.type,
      subtype: card.subtype,
      scanUrl: card.scanUrl,
      status: card.status,
      enterpriseId: card.enterpriseId,
      enterpriseName: card.Enterprise?.name ?? null,
      assignedTo: card.assignedClient?.name ?? null,
      assignedToClientId: card.assignedToClientId,
      createdAt: card.createdAt,
    }));

    res.json({
      success: true,
      data: {
        data: mapped,
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
          attributes: ["id", "name"],
          ...(search && search.trim() ? { where: clientWhere, required: true } : {}),
        },
        { model: Enterprise, attributes: ["id", "name"] },
        { model: NFCCard, attributes: ["id", "cardNumber"] },
      ],
      raw: true,
      nest: true,
    });

    // Aplatir les associations pour correspondre au format attendu par le frontend
    const mapped = rows.map((scan) => ({
      id: scan.id,
      clientId: scan.clientId,
      clientName: scan.Client?.name ?? null,
      cardNumber: scan.NFCCard?.cardNumber ?? null,
      enterpriseId: scan.enterpriseId,
      enterpriseName: scan.Enterprise?.name ?? null,
      pointsAdded: scan.pointsAdded,
      action: scan.pointsAdded > 0
        ? `+${scan.pointsAdded} points`
        : scan.pointsAdded < 0
        ? `${scan.pointsAdded} points`
        : "Consultation",
      points: scan.pointsAdded ?? 0,
      timestamp: scan.scannedAt ?? scan.createdAt,
      scannedAt: scan.scannedAt,
      createdAt: scan.createdAt,
    }));

    res.json({
      success: true,
      data: {
        data: mapped,
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
 * Créer une nouvelle entreprise + son compte OWNER en une seule transaction
 */
exports.createEnterprise = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      email,           // email de l'entreprise (aussi utilisé pour le compte OWNER)
      phone,
      location,
      adminFirstName,
      adminLastName,
      subscription,
      logo,
      ownerPassword,   // mot de passe du compte de connexion de l'entreprise
    } = req.body;

    // Validation
    if (!name || !email) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Nom et email sont requis" });
    }

    if (!ownerPassword || ownerPassword.length < 8) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Le mot de passe du compte entreprise doit contenir au moins 8 caractères",
      });
    }

    // Vérifier unicité email entreprise
    const existingEnterprise = await Enterprise.findOne({ where: { email }, transaction: t });
    if (existingEnterprise) {
      await t.rollback();
      return res.status(409).json({ success: false, message: "Une entreprise avec cet email existe déjà" });
    }

    // Vérifier unicité email utilisateur
    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback();
      return res.status(409).json({ success: false, message: "Un compte utilisateur existe déjà avec cet email" });
    }

    // Récupérer le rôle OWNER
    const ownerRole = await Role.findOne({ where: { name: "OWNER" }, transaction: t });
    if (!ownerRole) {
      await t.rollback();
      return res.status(500).json({ success: false, message: "Rôle OWNER introuvable" });
    }

    // 1. Créer l'entreprise
    const enterprise = await Enterprise.create({
      name,
      email,
      phone,
      location,
      adminFirstName,
      adminLastName,
      subscription: subscription || "Starter",
      logo,
      createdBy: req.user?.id,
    }, { transaction: t });

    // 2. Créer le compte User OWNER lié à cette entreprise
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    await User.create({
      firstName: adminFirstName || name,
      lastName: adminLastName || "",
      email,
      password: hashedPassword,
      roleId: ownerRole.id,
      enterpriseId: enterprise.id,
      isActive: true,
    }, { transaction: t });

    // 3. Créer l'abonnement
    const planPrices = { Starter: 29, Pro: 99, Enterprise: 299 };
    await Subscription.create({
      enterpriseId: enterprise.id,
      plan: subscription || "Starter",
      monthlyPrice: planPrices[subscription] ?? 29,
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Entreprise créée avec succès. Le compte de connexion a été créé.",
      data: { enterprise },
    });
  } catch (error) {
    await t.rollback();
    console.error("Create enterprise error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création de l'entreprise" });
  }
};

/**
 * DELETE /api/admin/enterprises/:id
 * Supprimer une entreprise et toutes ses données liées
 */
exports.deleteEnterprise = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findByPk(id, { transaction: t });
    if (!enterprise) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Entreprise non trouvée" });
    }

    // Suppression en cascade dans l'ordre
    await Scan.destroy({ where: { enterpriseId: id }, transaction: t });
    await NFCCard.destroy({ where: { enterpriseId: id }, transaction: t });
    await Client.destroy({ where: { enterpriseId: id }, transaction: t });
    await Subscription.destroy({ where: { enterpriseId: id }, transaction: t });
    // Supprimer les comptes utilisateurs liés à cette entreprise
    await User.destroy({ where: { enterpriseId: id }, transaction: t });
    await enterprise.destroy({ transaction: t });

    await t.commit();

    res.json({ success: true, message: "Entreprise supprimée avec succès" });
  } catch (error) {
    await t.rollback();
    console.error("Delete enterprise error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression de l'entreprise" });
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

// Fonction pour générer les initiales du nom d'entreprise
const getEnterpriseInitials = (name) => {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('')
    .slice(0, 4); // Limite à 4 initiales max pour garder le préfixe court
};

// Mapping des types de carte pour les initiales
const typeMap = {
  "Fidélité Entreprise": "FID",
  "Restaurant": "RES",
  "Carte de visite": "CDV"
};

// Mapping des subtypes pour les initiales
const subtypeMap = {
  "Basic": "BAS",
  "Standard": "STD",
  "Luxe": "LUX"
};

/**
 * POST /api/admin/cards/generate
 * Générer des cartes NFC en masse pour une entreprise
 */
exports.generateCards = async (req, res) => {
  try {
    // On ne demande plus le "prefix", mais le "scanBaseUrl" et le "subtype"
    const { enterpriseId, type, subtype, scanBaseUrl, quantity } = req.body;

    if (!enterpriseId || !type || !scanBaseUrl || !quantity) {
      return res.status(400).json({
        success: false,
        message: "enterpriseId, type, scanBaseUrl et quantity sont requis",
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

    // 1. Construire le préfixe dynamique avec initiales (ex: REGA-FID-0003)
    const enterpriseInitials = getEnterpriseInitials(enterprise.name);
    const typeInitials = typeMap[type] || "XXX";
    let dynamicPrefix = `${enterpriseInitials}-${typeInitials}`;
    
    if (type === "Restaurant" && subtype) {
      const subtypeInitials = subtypeMap[subtype] || "XXX";
      dynamicPrefix += `-${subtypeInitials}`;
    }

    // 2. Gérer l'auto-incrémentation
    // On compte combien de cartes existent déjà avec ce préfixe pour ne pas écraser les numéros
    const existingCardsCount = await NFCCard.count({
      where: {
        cardNumber: {
          [Op.like]: `${dynamicPrefix}-%`
        }
      }
    });

    // 3. Préparer le tableau de cartes
    const cards = [];
    // On s'assure que l'URL de base se termine par un "/"
    const baseUrl = scanBaseUrl.endsWith('/') ? scanBaseUrl : `${scanBaseUrl}/`;

    for (let i = 0; i < qty; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Numéro auto-incrémenté à 4 chiffres (ex: 0001, 0002...)
      const suffix = String(existingCardsCount + i + 1).padStart(4, "0");
      
      cards.push({
        cardNumber: `${dynamicPrefix}-${suffix}`,
        cardCode: code,
        enterpriseId,
        type,
        subtype: subtype || null,
        scanUrl: `${baseUrl}${code}`, // Assemblage du lien final
        status: "unassigned",
      });
    }

    const created = await NFCCard.bulkCreate(cards, {
      ignoreDuplicates: true, // Sécurité au cas où le count aurait eu un léger décalage
    });

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
