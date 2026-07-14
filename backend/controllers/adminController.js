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
  CardType,
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
          attributes: ['id', 'createdAt', 'pointsAdded', 'notes'],
          include: [
            { model: Client, attributes: ['id', 'name'] },
            { model: NFCCard, attributes: ['id', 'cardNumber', 'cardCode'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: 20,
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

    // Récupérer le nombre de scans pour chaque carte
    const cardIds = rows.map(card => card.id);
    const scanCounts = await Scan.findAll({
      attributes: [
        'cardId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'scanCount']
      ],
      where: {
        cardId: { [Op.in]: cardIds }
      },
      group: ['cardId'],
      raw: true,
    });

    // Créer un map pour accès rapide
    const scanCountMap = {};
    scanCounts.forEach(sc => {
      scanCountMap[sc.cardId] = parseInt(sc.scanCount) || 0;
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
      scanCount: scanCountMap[card.id] || 0, // ✅ Ajout du nombre de scans
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
      cardGeneration,
    } = req.body;

    // Validation
    if (!name || !email) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Nom et email sont requis" });
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

    // 2. Générer un mot de passe fort aléatoire
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const plainPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Créer le compte User OWNER lié à cette entreprise
    await User.create({
      firstName: adminFirstName || name,
      lastName: adminLastName || "",
      email,
      password: hashedPassword,
      roleId: ownerRole.id,
      enterpriseId: enterprise.id,
      mustChangePassword: true,
      isActive: true,
    }, { transaction: t });

    // 4. Créer l'abonnement
    const planPrices = { Starter: 29, Pro: 99, Enterprise: 299 };
    await Subscription.create({
      enterpriseId: enterprise.id,
      plan: subscription || "Starter",
      monthlyPrice: planPrices[subscription] ?? 29,
    }, { transaction: t });

    let generatedCards = 0;

    // 5. Si génération de cartes activée, créer automatiquement des cartes (sans créer de service par défaut)
    if (cardGeneration?.enabled && (cardGeneration?.cardTypeId || cardGeneration?.type)) {
      const { cardTypeId, type: cardTypeName, subtype, quantity, serviceName, servicePoints, scanBaseUrl: providedScanBaseUrl } = cardGeneration;
      const qty = parseInt(quantity, 10);

      if (Number.isInteger(qty) && qty > 0 && qty <= 1000) {
        // Charger le type de carte par id ou par nom
        let cardTypeRecord = null;
        if (cardTypeId) {
          cardTypeRecord = await CardType.findByPk(cardTypeId, { transaction: t });
        } else if (cardTypeName) {
          cardTypeRecord = await CardType.findOne({ where: { name: cardTypeName }, transaction: t });
        }

        if (!cardTypeRecord) {
          await t.rollback();
          return res.status(404).json({ success: false, message: "Type de carte introuvable" });
        }
        const type = cardTypeRecord.name;

        // Déterminer l'URL de base du scan: priorité au scanBaseUrl fourni par le frontend
        const scanBaseUrl = (providedScanBaseUrl && String(providedScanBaseUrl).trim()) || process.env.SCAN_BASE_URL;

        // Importer l'utilitaire de génération d'URL
        const { generateScanUrl, generateCardCode } = require("../utils/urlGenerator");

        const enterpriseInitials = getEnterpriseInitials(enterprise.name);
        const typeInitials = getTypeInitials(type);
        let dynamicPrefix = `${enterpriseInitials}-${typeInitials}`;

        if (subtype) {
          const subtypeInitials = getTypeInitials(subtype);
          dynamicPrefix += `-${subtypeInitials}`;
        }

        const existingCardsCount = await NFCCard.count({
          where: {
            cardNumber: {
              [Op.like]: `${dynamicPrefix}-%`
            }
          },
          transaction: t,
        });

        const cards = [];
        for (let i = 0; i < qty; i++) {
          const cardCode = generateCardCode();
          const suffix = String(existingCardsCount + i + 1).padStart(4, '0');

          // Ne pas générer de scanUrl ni de service puisqu'on ne crée pas de service automatique
          const scanUrl = null;

          cards.push({
            cardNumber: `${dynamicPrefix}-${suffix}`,
            cardCode,
            enterpriseId: enterprise.id,
            cardTypeId: cardTypeRecord.id,
            serviceId: null,
            type,
            subtype: subtype || null,
            scanUrl,
            status: "unassigned",
          });
        }

        const created = await NFCCard.bulkCreate(cards, { transaction: t, ignoreDuplicates: true });
        generatedCards = created.length;
        await Enterprise.increment("cardsCount", {
          by: created.length,
          where: { id: enterprise.id },
          transaction: t,
        });
      }
    }

    await t.commit();

    const responseData = {
      enterprise,
      generatedPassword: plainPassword,
      generatedCards
    };

    res.status(201).json({
      success: true,
      message: "Entreprise créée avec succès.",
      data: responseData,
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
 * GET /api/admin/enterprises/:id/services
 * Récupérer tous les services d'une entreprise
 */
exports.getEnterpriseServices = async (req, res) => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findByPk(id);
    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: "Entreprise non trouvée",
      });
    }

    const { Service } = require("../models");
    const services = await Service.findAll({
      where: { enterpriseId: id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Get enterprise services error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
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

// Fonction pour générer les initiales du nom d'entreprise
const getEnterpriseInitials = (name) => {
  // Nettoyer le nom : remplacer les tirets, underscores, etc. par des espaces
  const cleanedName = name.replace(/[-_\s]+/g, ' ').trim();
  
  // Séparer en mots
  const words = cleanedName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return 'ENT';
  
  // Si 1 mot : prendre les 4 premières lettres
  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }
  
  // Si 2 mots : prendre 2 premières lettres du 1er + 2 premières du 2ème
  if (words.length === 2) {
    return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  }
  
  // Si 3+ mots : prendre initiales des 3 premiers mots
  return words
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join('');
};

// Mapping des types de carte pour les initiales
const getTypeInitials = (typeName) =>
  typeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0)
    .slice(0, 3).map((w, i, arr) => arr.length === 1 ? w.slice(0, 3).toUpperCase() : w[0].toUpperCase()).join('');

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
    const { enterpriseId, cardTypeId, serviceId, subtype, quantity } = req.body;

    if (!enterpriseId || !cardTypeId || !serviceId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "enterpriseId, cardTypeId, serviceId et quantity sont requis",
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      return res.status(400).json({
        success: false,
        message: "La quantité doit être entre 1 et 1000",
      });
    }

    // Charger l'entreprise
    const enterprise = await Enterprise.findByPk(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ success: false, message: "Entreprise non trouvée" });
    }

    // Charger le type de carte
    const cardTypeRecord = await CardType.findByPk(cardTypeId);
    if (!cardTypeRecord) {
      return res.status(404).json({ success: false, message: "Type de carte introuvable" });
    }
    const type = cardTypeRecord.name;

    // Charger le service pour obtenir le scanToken
    const { Service } = require("../models");
    const service = await Service.findOne({
      where: { id: serviceId, enterpriseId },
    });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service introuvable" });
    }

    // Vérifier la variable d'environnement SCAN_BASE_URL
    const scanBaseUrl = process.env.SCAN_BASE_URL;
    if (!scanBaseUrl) {
      return res.status(500).json({
        success: false,
        message: "SCAN_BASE_URL n'est pas configuré dans les variables d'environnement",
      });
    }

    // Importer l'utilitaire de génération d'URL
    const { generateScanUrl, generateCardCode } = require("../utils/urlGenerator");

    // 1. Construire le préfixe dynamique avec initiales
    const enterpriseInitials = getEnterpriseInitials(enterprise.name);
    const typeInitials = getTypeInitials(type);
    let dynamicPrefix = `${enterpriseInitials}-${typeInitials}`;

    if (subtype) {
      const subtypeInitials = getTypeInitials(subtype);
      dynamicPrefix += `-${subtypeInitials}`;
    }

    // 2. Gérer l'auto-incrémentation
    const existingCardsCount = await NFCCard.count({
      where: {
        cardNumber: {
          [Op.like]: `${dynamicPrefix}-%`,
        },
      },
    });

    // 3. Préparer le tableau de cartes
    const cards = [];

    for (let i = 0; i < qty; i++) {
      const cardCode = generateCardCode();

      // Numéro auto-incrémenté à 4 chiffres (ex: 0001, 0002...)
      const suffix = String(existingCardsCount + i + 1).padStart(4, "0");

      // Générer l'URL de scan dynamique
      const scanUrl = generateScanUrl({
        cardType: type,
        enterpriseName: enterprise.name,
        subtype: subtype || null,
        scanToken: service.scanToken,
        baseUrl: scanBaseUrl,
      });

      cards.push({
        cardNumber: `${dynamicPrefix}-${suffix}`,
        cardCode,
        enterpriseId,
        cardTypeId,
        serviceId,
        type,
        subtype: subtype || null,
        scanUrl,
        status: "unassigned",
      });
    }

    const created = await NFCCard.bulkCreate(cards, {
      ignoreDuplicates: true,
    });

    await Enterprise.increment("cardsCount", {
      by: created.length,
      where: { id: enterpriseId },
    });

    res.status(201).json({
      success: true,
      message: `${created.length} carte(s) générée(s) avec succès`,
      data: { generated: created.length, scanUrl: cards[0]?.scanUrl },
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
// TYPES DE CARTES
// ─────────────────────────────────────────────────────────────

exports.getCardTypes = async (req, res) => {
  try {
    const types = await CardType.findAll({ order: [['createdAt', 'ASC']] });
    const result = await Promise.all(types.map(async (ct) => {
      const [totalCards, enterprises, totalScans] = await Promise.all([
        NFCCard.count({ where: { cardTypeId: ct.id } }),
        Enterprise.findAll({
          include: [{ model: NFCCard, where: { cardTypeId: ct.id }, attributes: [] }],
          attributes: ['id', 'name', 'logo', 'status'],
          group: ['Enterprise.id'],
        }),
        Scan.count({
          include: [{ model: NFCCard, where: { cardTypeId: ct.id }, attributes: [] }],
        }),
      ]);
      return { id: ct.id, type: ct.name, description: ct.description, subtypes: ct.subtypes || [], totalCards, totalScans, enterprises };
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getCardTypes error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des types' });
  }
};

exports.getCardTypeDetail = async (req, res) => {
  try {
    const { type } = req.params;
    const cardType = await CardType.findByPk(type);
    if (!cardType) return res.status(404).json({ success: false, message: 'Type introuvable' });
    const enterprises = await Enterprise.findAll({
      include: [{ model: NFCCard, where: { cardTypeId: type }, attributes: ['id', 'status'] }],
      attributes: ['id', 'name', 'logo', 'status'],
    });
    const enriched = await Promise.all(enterprises.map(async (e) => {
      const scans = await Scan.count({
        include: [{ model: NFCCard, where: { cardTypeId: type, enterpriseId: e.id }, attributes: [] }],
      });
      return {
        id: e.id, name: e.name, logo: e.logo, status: e.status,
        totalCards: e.NFCCards.length,
        activeCards: e.NFCCards.filter(c => c.status === 'active').length,
        totalScans: scans,
      };
    }));
    res.json({ success: true, data: { type: cardType.name, subtypes: cardType.subtypes || [], enterprises: enriched } });
  } catch (error) {
    console.error('getCardTypeDetail error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du détail' });
  }
};

exports.createCardType = async (req, res) => {
  try {
    const { name, description, subtypes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Le nom est requis' });
    const existing = await CardType.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ success: false, message: 'Ce type de carte existe déjà' });
    const cardType = await CardType.create({ 
      name: name.trim(), 
      description: description || null,
      subtypes: Array.isArray(subtypes) ? subtypes : []
    });
    res.status(201).json({ success: true, data: { ...cardType.toJSON(), subtypes: cardType.subtypes || [] } });
  } catch (error) {
    console.error('createCardType error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du type' });
  }
};

exports.updateCardType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subtypes } = req.body;
    const cardType = await CardType.findByPk(id);
    if (!cardType) return res.status(404).json({ success: false, message: 'Type introuvable' });
    if (name && name.trim() !== cardType.name) {
      const existing = await CardType.findOne({ where: { name: name.trim() } });
      if (existing) return res.status(409).json({ success: false, message: 'Ce nom est déjà utilisé' });
    }
    await cardType.update({ 
      name: name?.trim() ?? cardType.name, 
      description: description ?? cardType.description,
      subtypes: Array.isArray(subtypes) ? subtypes : cardType.subtypes
    });
    res.json({ success: true, data: { ...cardType.toJSON(), subtypes: cardType.subtypes || [] } });
  } catch (error) {
    console.error('updateCardType error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du type' });
  }
};

exports.deleteCardType = async (req, res) => {
  try {
    const { id } = req.params;
    const cardType = await CardType.findByPk(id);
    if (!cardType) return res.status(404).json({ success: false, message: 'Type introuvable' });
    const inUse = await NFCCard.count({ where: { cardTypeId: id } });
    if (inUse > 0) return res.status(400).json({ success: false, message: `Impossible de supprimer : ${inUse} carte(s) utilisent ce type` });
    await cardType.destroy();
    res.json({ success: true, message: 'Type supprimé' });
  } catch (error) {
    console.error('deleteCardType error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du type' });
  }
};

// ─────────────────────────────────────────────────────────────
// STOCK CARTES
// ─────────────────────────────────────────────────────────────

exports.getCardStock = async (req, res) => {
  try {
    const [total, active, inactive, unassigned] = await Promise.all([
      NFCCard.count(),
      NFCCard.count({ where: { status: 'active' } }),
      NFCCard.count({ where: { status: 'inactive' } }),
      NFCCard.count({ where: { status: 'unassigned' } }),
    ]);

    const byEnterprise = await NFCCard.findAll({
      attributes: [
        'enterpriseId',
        [require('sequelize').fn('COUNT', require('sequelize').col('NFCCard.id')), 'total'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN \"NFCCard\".status = 'active' THEN 1 ELSE 0 END")), 'active'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN \"NFCCard\".status = 'unassigned' THEN 1 ELSE 0 END")), 'unassigned'],
      ],
      include: [{ model: Enterprise, attributes: ['name', 'logo'] }],
      group: ['enterpriseId', 'Enterprise.id'],
      raw: true,
      nest: true,
    });

    const byType = await NFCCard.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
      ],
      group: ['type'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        summary: { total, active, inactive, unassigned, sold: active },
        byEnterprise: byEnterprise.map(r => ({
          enterpriseId: r.enterpriseId,
          name: r.Enterprise?.name,
          logo: r.Enterprise?.logo,
          total: parseInt(r.total),
          active: parseInt(r.active) || 0,
          unassigned: parseInt(r.unassigned) || 0,
        })),
        byType: byType.map(r => ({ type: r.type, total: parseInt(r.total) })),
      },
    });
  } catch (error) {
    console.error('getCardStock error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du stock' });
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
