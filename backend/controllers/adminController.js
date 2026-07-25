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
 * Générer un mot de passe aléatoire
 */
function generateRandomPassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

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
        const { generateCardScanUrl, generateCardCode, generateCardScanToken } = require("../utils/urlGenerator");

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
          const scanToken = generateCardScanToken();
          const suffix = String(existingCardsCount + i + 1).padStart(4, '0');

          // Générer l'URL de scan basée sur la carte (pas de service requis)
          const scanUrl = generateCardScanUrl({
            enterpriseName: enterprise.name,
            cardType: type,
            scanToken: scanToken,
            baseUrl: providedScanBaseUrl || process.env.SCAN_BASE_URL,
          });

          cards.push({
            cardNumber: `${dynamicPrefix}-${suffix}`,
            cardCode,
            scanToken,
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

    if (!enterpriseId || !cardTypeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "enterpriseId, cardTypeId et quantity sont requis",
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

    let service = null;
    if (serviceId) {
      const { Service } = require("../models");
      service = await Service.findOne({
        where: { id: serviceId, enterpriseId },
      });

      if (!service) {
        return res.status(404).json({ success: false, message: "Service introuvable" });
      }
    }

    const scanBaseUrl = process.env.SCAN_BASE_URL;
    if (service && !scanBaseUrl) {
      return res.status(500).json({
        success: false,
        message: "SCAN_BASE_URL n'est pas configuré dans les variables d'environnement",
      });
    }

    // Importer l'utilitaire de génération d'URL
    const { generateCardScanUrl, generateCardCode, generateCardScanToken } = require("../utils/urlGenerator");

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
      const scanToken = generateCardScanToken();

      // Numéro auto-incrémenté à 4 chiffres (ex: 0001, 0002...)
      const suffix = String(existingCardsCount + i + 1).padStart(4, "0");

      // Générer l'URL de scan basée sur la carte (pas le service)
      const scanUrl = generateCardScanUrl({
        enterpriseName: enterprise.name,
        cardType: type,
        scanToken: scanToken,
        baseUrl: scanBaseUrl,
      });

      cards.push({
        cardNumber: `${dynamicPrefix}-${suffix}`,
        cardCode,
        scanToken,
        enterpriseId,
        cardTypeId,
        serviceId: service ? service.id : null,
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
 * POST /api/admin/cards/generate-stock
 * Générer des cartes NFC dans le stock global Maze (sans entreprise, sans type).
 * Le type et sous-type sont attribués lors de l'assignation à une entreprise.
 * Le lot reçoit un stockBatchId unique pour traçabilité.
 */
exports.generateStockCards = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity) {
      return res.status(400).json({
        success: false,
        message: "quantity est requis",
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 5000) {
      return res.status(400).json({
        success: false,
        message: "La quantité doit être entre 1 et 5000",
      });
    }

    const { generateCardCode, generateCardScanToken } = require("../utils/urlGenerator");

    // Générer un identifiant de lot unique
    const now = new Date();
    const batchId = `BATCH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Préfixe neutre pour le stock : STK + auto-incrément global
    const existingCount = await NFCCard.count({
      where: { cardNumber: { [Op.like]: `STK-%` } },
    });

    const cards = [];
    for (let i = 0; i < qty; i++) {
      const cardCode = generateCardCode();
      const scanToken = generateCardScanToken();
      const suffix = String(existingCount + i + 1).padStart(6, "0");

      cards.push({
        cardNumber: `STK-${suffix}`,
        cardCode,
        scanToken,
        enterpriseId: null,  // Pas d'entreprise : stock global
        cardTypeId: null,    // Pas de type encore : attribué à l'assignation
        serviceId: null,
        type: null,          // Attribué lors de l'assignation
        subtype: null,
        scanUrl: null,
        status: "unassigned",
        stockBatchId: batchId,
      });
    }

    const created = await NFCCard.bulkCreate(cards, { ignoreDuplicates: true });

    res.status(201).json({
      success: true,
      message: `${created.length} carte(s) ajoutée(s) au stock global`,
      data: {
        generated: created.length,
        batchId,
      },
    });
  } catch (error) {
    console.error("Generate stock cards error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la génération du stock" });
  }
};

/**
/**
 * POST /api/admin/cards/assign-to-enterprise
 * Assigner des cartes du stock global à une entreprise.
 * C'est ICI qu'on attribue le type et sous-type aux cartes vierges.
 * Body: { enterpriseId, cardTypeId, subtype?, quantity?, batchId?, cardIds? }
 */
exports.assignStockToEnterprise = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { enterpriseId, cardTypeId, subtype, quantity, batchId, cardIds } = req.body;

    if (!enterpriseId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "enterpriseId est requis" });
    }

    if (!cardTypeId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "cardTypeId est requis — le type est attribué lors de l'assignation" });
    }

    const enterprise = await Enterprise.findByPk(enterpriseId, { transaction: t });
    if (!enterprise) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Entreprise non trouvée" });
    }

    const cardTypeRecord = await CardType.findByPk(cardTypeId, { transaction: t });
    if (!cardTypeRecord) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Type de carte introuvable" });
    }
    const type = cardTypeRecord.name;

    const scanBaseUrl = process.env.SCAN_BASE_URL;

    // Trouver les cartes vierges à assigner (sans entreprise, sans type)
    let cardsToAssign;

    if (cardIds && Array.isArray(cardIds) && cardIds.length > 0) {
      cardsToAssign = await NFCCard.findAll({
        where: { id: { [Op.in]: cardIds }, enterpriseId: null, status: "unassigned" },
        transaction: t,
      });
    } else if (batchId) {
      cardsToAssign = await NFCCard.findAll({
        where: { stockBatchId: batchId, enterpriseId: null, status: "unassigned" },
        transaction: t,
      });
    } else if (quantity) {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty < 1) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Quantité invalide" });
      }
      cardsToAssign = await NFCCard.findAll({
        where: { enterpriseId: null, status: "unassigned" },
        limit: qty,
        order: [["createdAt", "ASC"]], // FIFO
        transaction: t,
      });
    } else {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Fournir cardIds, batchId ou quantity",
      });
    }

    if (cardsToAssign.length === 0) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Aucune carte disponible dans le stock" });
    }

    const { generateCardScanUrl } = require("../utils/urlGenerator");

    // Construire le préfixe de numérotation : initiales entreprise + type [+ sous-type]
    const enterpriseInitials = getEnterpriseInitials(enterprise.name);
    const typeInitials = getTypeInitials(type);
    let dynamicPrefix = `${enterpriseInitials}-${typeInitials}`;
    if (subtype) {
      dynamicPrefix += `-${getTypeInitials(subtype)}`;
    }

    // Auto-incrément basé sur les cartes existantes du même préfixe
    const existingCount = await NFCCard.count({
      where: { cardNumber: { [Op.like]: `${dynamicPrefix}-%` } },
      transaction: t,
    });

    // Assigner chaque carte : type, sous-type, nouveau numéro, scanUrl
    for (let i = 0; i < cardsToAssign.length; i++) {
      const card = cardsToAssign[i];
      const suffix = String(existingCount + i + 1).padStart(4, "0");
      const newCardNumber = `${dynamicPrefix}-${suffix}`;

      const scanUrl = scanBaseUrl
        ? generateCardScanUrl({
          enterpriseName: enterprise.name,
          cardType: type,
          scanToken: card.scanToken,
          baseUrl: scanBaseUrl,
        })
        : null;

      await card.update(
        {
          enterpriseId,
          cardTypeId,
          type,
          subtype: subtype || null,
          cardNumber: newCardNumber,
          scanUrl,
          status: "unassigned",
        },
        { transaction: t }
      );
    }

    // Mettre à jour le compteur de cartes de l'entreprise
    await Enterprise.increment("cardsCount", {
      by: cardsToAssign.length,
      where: { id: enterpriseId },
      transaction: t,
    });

    await t.commit();

    res.status(200).json({
      success: true,
      message: `${cardsToAssign.length} carte(s) assignée(s) à ${enterprise.name} avec le type "${type}"`,
      data: {
        assigned: cardsToAssign.length,
        enterpriseId,
        enterpriseName: enterprise.name,
        type,
        subtype: subtype || null,
        cardIds: cardsToAssign.map((c) => c.id),
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Assign stock to enterprise error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'assignation du stock" });
  }
};

/**
 * PATCH /api/admin/cards/:id/status
 * Activer ou désactiver manuellement une carte NFC
 * Body: { status: "active" | "inactive" }
 */
exports.updateCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Le statut doit être 'active' ou 'inactive'",
      });
    }

    const card = await NFCCard.findByPk(id, {
      include: [{ model: Enterprise, attributes: ["id", "name"] }],
    });

    if (!card) {
      return res.status(404).json({ success: false, message: "Carte introuvable" });
    }

    if (!card.enterpriseId) {
      return res.status(400).json({
        success: false,
        message: "Impossible d'activer une carte non assignée à une entreprise",
      });
    }

    await card.update({ status });

    res.json({
      success: true,
      message: `Carte ${status === "active" ? "activée" : "désactivée"} avec succès`,
      data: {
        id: card.id,
        cardNumber: card.cardNumber,
        status: card.status,
        enterpriseName: card.Enterprise?.name,
      },
    });
  } catch (error) {
    console.error("Update card status error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du statut" });
  }
};

/**
 * GET /api/admin/cards/stock-global
 * Stock global Maze : cartes vierges sans entreprise ni type
 */
exports.getGlobalStock = async (req, res) => {
  try {
    const where = { enterpriseId: null, status: "unassigned" };

    const [total, byBatch] = await Promise.all([
      NFCCard.count({ where }),

      // Répartition par lot
      NFCCard.findAll({
        attributes: [
          "stockBatchId",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("MIN", sequelize.col("createdAt")), "createdAt"],
        ],
        where: { enterpriseId: null, status: "unassigned", stockBatchId: { [Op.ne]: null } },
        group: ["stockBatchId"],
        order: [[sequelize.fn("MIN", sequelize.col("createdAt")), "DESC"]],
        raw: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byBatch: byBatch.map((r) => ({
          batchId: r.stockBatchId,
          count: parseInt(r.count),
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get global stock error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération du stock global" });
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

    // Cartes dans le stock global Maze (pas encore assignées à une entreprise)
    const globalStock = await NFCCard.count({ where: { enterpriseId: null } });

    // Stock dispo par entreprise (cartes assignées à une entreprise mais pas encore à un client)
    const availableForEnterprise = await NFCCard.count({
      where: { status: 'unassigned', enterpriseId: { [Op.ne]: null } },
    });

    const byEnterprise = await NFCCard.findAll({
      attributes: [
        'enterpriseId',
        [require('sequelize').fn('COUNT', require('sequelize').col('NFCCard.id')), 'total'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN \"NFCCard\".status = 'active' THEN 1 ELSE 0 END")), 'active'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN \"NFCCard\".status = 'unassigned' THEN 1 ELSE 0 END")), 'unassigned'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN \"NFCCard\".status = 'inactive' THEN 1 ELSE 0 END")), 'inactive'],
      ],
      include: [{ model: Enterprise, attributes: ['name', 'logo'] }],
      where: { enterpriseId: { [Op.ne]: null } }, // Exclure le stock global
      group: ['enterpriseId', 'Enterprise.id'],
      raw: true,
      nest: true,
    });

    const byType = await NFCCard.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
        [require('sequelize').fn('SUM', require('sequelize').literal("CASE WHEN \"enterpriseId\" IS NULL THEN 1 ELSE 0 END")), 'inStock'],
      ],
      group: ['type'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        summary: {
          total,
          active,
          inactive,
          unassigned,
          sold: active,
          globalStock,          // Cartes Maze sans entreprise
          availableForEnterprise, // Cartes assignées à une entreprise mais pas à un client
        },
        byEnterprise: byEnterprise.map(r => ({
          enterpriseId: r.enterpriseId,
          name: r.Enterprise?.name,
          logo: r.Enterprise?.logo,
          total: parseInt(r.total),
          active: parseInt(r.active) || 0,
          unassigned: parseInt(r.unassigned) || 0,
          inactive: parseInt(r.inactive) || 0,
        })),
        byType: byType.map(r => ({
          type: r.type,
          total: parseInt(r.total),
          inStock: parseInt(r.inStock) || 0,
        })),
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


// ─────────────────────────────────────────────────────────────
// GESTION DES UTILISATEURS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Liste tous les utilisateurs avec pagination
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, roleId, isActive, enterpriseId } = req.query;

    const where = {};

    // Filtre par rôle
    if (roleId) {
      where.roleId = roleId;
    }

    // Filtre par statut actif/inactif
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Filtre par entreprise
    if (enterpriseId) {
      where.enterpriseId = enterpriseId;
    }

    // Filtre recherche sur nom, prénom ou email
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
      include: [
        {
          model: Role,
          attributes: ["id", "name", "description"],
        },
        {
          model: Enterprise,
          as: "enterprise",
          attributes: ["id", "name", "logo"],
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

/**
 * GET /api/admin/users/:id
 * Détails d'un utilisateur
 */
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          attributes: ["id", "name", "description"],
        },
        {
          model: Enterprise,
          as: "enterprise",
          attributes: ["id", "name", "logo", "status", "subscription"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user detail error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
};

/**
 * POST /api/admin/users
 * Créer un nouvel utilisateur
 */
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      roleId,
      enterpriseId,
      isActive,
      mustChangePassword,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !roleId) {
      return res.status(400).json({
        success: false,
        message: "Prénom, nom, email et rôle sont requis",
      });
    }

    // Vérifier unicité email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Vérifier que le rôle existe
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rôle introuvable",
      });
    }

    // Si enterpriseId fourni, vérifier que l'entreprise existe
    if (enterpriseId) {
      const enterprise = await Enterprise.findByPk(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({
          success: false,
          message: "Entreprise introuvable",
        });
      }
    }

    // Générer un mot de passe si non fourni
    const plainPassword = password || generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Créer l'utilisateur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roleId,
      enterpriseId: enterpriseId || null,
      isActive: isActive !== undefined ? isActive : true,
      mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : !password,
    });

    // Charger l'utilisateur avec ses relations
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          attributes: ["id", "name", "description"],
        },
        {
          model: Enterprise,
          as: "enterprise",
          attributes: ["id", "name", "logo"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: {
        user: createdUser,
        generatedPassword: password ? undefined : plainPassword,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur",
    });
  }
};

/**
 * PUT /api/admin/users/:id
 * Mettre à jour un utilisateur
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      roleId,
      enterpriseId,
      isActive,
      mustChangePassword,
      password,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier unicité email si changé
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Un utilisateur avec cet email existe déjà",
        });
      }
    }

    // Vérifier que le rôle existe si changé
    if (roleId && roleId !== user.roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Rôle introuvable",
        });
      }
    }

    // Vérifier que l'entreprise existe si changée
    if (enterpriseId && enterpriseId !== user.enterpriseId) {
      const enterprise = await Enterprise.findByPk(enterpriseId);
      if (!enterprise) {
        return res.status(404).json({
          success: false,
          message: "Entreprise introuvable",
        });
      }
    }

    // Préparer les données de mise à jour
    const updateData = {
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      email: email !== undefined ? email : user.email,
      roleId: roleId !== undefined ? roleId : user.roleId,
      enterpriseId: enterpriseId !== undefined ? enterpriseId : user.enterpriseId,
      isActive: isActive !== undefined ? isActive : user.isActive,
      mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : user.mustChangePassword,
    };

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.mustChangePassword = true;
    }

    // Mettre à jour l'utilisateur
    await user.update(updateData);

    // Charger l'utilisateur avec ses relations
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Role,
          attributes: ["id", "name", "description"],
        },
        {
          model: Enterprise,
          as: "enterprise",
          attributes: ["id", "name", "logo"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Supprimer un utilisateur
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Empêcher la suppression de son propre compte
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
    });
  }
};

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Activer/désactiver un utilisateur
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Empêcher la désactivation de son propre compte
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas désactiver votre propre compte",
      });
    }

    // Inverser le statut
    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de statut",
    });
  }
};

/**
 * POST /api/admin/users/:id/reset-password
 * Réinitialiser le mot de passe d'un utilisateur
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Générer un nouveau mot de passe
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et forcer le changement
    await user.update({
      password: hashedPassword,
      mustChangePassword: true,
    });

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
      data: {
        newPassword,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe",
    });
  }
};
