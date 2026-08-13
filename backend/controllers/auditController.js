const { AuditLog, User, Client } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

const ACTION_LABELS = {
  CREATE_ENTERPRISE: "Création entreprise",
  UPDATE_ENTERPRISE: "Modification entreprise",
  DELETE_ENTERPRISE: "Suppression entreprise",
  GENERATE_CARDS: "Génération cartes",
  ASSIGN_CARD: "Attribution carte",
  DELETE_CARD: "Suppression carte",
  CREATE_USER: "Création utilisateur",
  UPDATE_USER: "Modification utilisateur",
  DELETE_USER: "Suppression utilisateur",
  LOGIN_SUCCESS: "Connexion réussie",
  LOGIN_FAILED: "Échec connexion",
  LOGOUT: "Déconnexion",
  UPDATE_SETTINGS: "Mise à jour config",
  ENABLE_2FA: "Activation 2FA",
  DISABLE_2FA: "Désactivation 2FA",
  UPDATE_SUBSCRIPTION: "Modification abonnement",
  UPDATE_CARD: "Modification carte",
  RESET_PASSWORD: "Réinitialisation mot de passe",
  CREATE_CLIENT: "Création client",
  UPDATE_CLIENT: "Modification client",
  DELETE_CLIENT: "Suppression client",
  CREATE_SERVICE: "Création service",
  UPDATE_SERVICE: "Modification service",
  DELETE_SERVICE: "Suppression service",
  CREATE_REWARD: "Création récompense",
  UPDATE_REWARD: "Modification récompense",
  DELETE_REWARD: "Suppression récompense",
  SCAN_CARD: "Scan carte NFC",
  ADJUST_POINTS: "Ajustement points",
  REDEEM_REWARD: "Utilisation récompense",
  CLIENT_IDENTIFY: "Identification client (scan)",
  CHANGE_PASSWORD: "Changement mot de passe",
  UPDATE_PROFILE: "Mise à jour profil",
  UPLOAD_LOGO: "Upload logo",
};

const RESOURCE_LABELS = {
  enterprise: "Entreprise",
  nfcCard: "Carte NFC",
  user: "Utilisateur",
  scan: "Scan",
  settings: "Paramètres",
  auth: "Authentification",
  client: "Client",
  service: "Service",
  reward: "Récompense",
  redemption: "Échange récompense",
};

const EXPORT_LIMIT = 10000;

const auditLogIncludes = [
  {
    model: User,
    attributes: ["id", "firstName", "lastName", "email"],
    required: false,
  },
  {
    model: Client,
    attributes: ["id", "name", "email"],
    required: false,
  },
];

function getActorLabel(log) {
  if (log.User) {
    return {
      name: `${log.User.firstName} ${log.User.lastName}`,
      email: log.User.email,
    };
  }
  if (log.Client) {
    return {
      name: `${log.Client.name} (client)`,
      email: log.Client.email || "",
    };
  }
  return { name: "Système / public", email: "" };
}

function getPeriodStart(period) {
  const now = new Date();
  switch (period) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "7d":
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildAuditWhere(query) {
  const { action, resource, success, search, period, startDate, endDate, userId } = query;
  const where = {};

  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (userId) where.userId = userId;
  if (success === "true") where.success = true;
  if (success === "false") where.success = false;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate);
  } else if (period) {
    where.createdAt = { [Op.gte]: getPeriodStart(period) };
  }

  if (search) {
    where[Op.or] = [
      { details: { [Op.iLike]: `%${search}%` } },
      { action: { [Op.iLike]: `%${search}%` } },
      { resource: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return where;
}

exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const where = buildAuditWhere(req.query);

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: auditLogIncludes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des logs d'audit",
    });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const startDate = getPeriodStart(period);

    const where = { createdAt: { [Op.gte]: startDate } };

    const total = await AuditLog.count({ where });
    const success = await AuditLog.count({ where: { ...where, success: true } });
    const failed = total - success;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "100.0";

    const topActions = await AuditLog.findAll({
      attributes: [
        "action",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["action"],
      order: [[sequelize.literal("count"), "DESC"]],
      limit: 5,
      raw: true,
    });

    const topUsersRaw = await AuditLog.findAll({
      attributes: [
        "userId",
        [sequelize.fn("COUNT", sequelize.col("AuditLog.id")), "count"],
      ],
      where: { ...where, userId: { [Op.ne]: null } },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "email"],
          required: true,
        },
      ],
      group: ["userId", "User.id", "User.firstName", "User.lastName", "User.email"],
      order: [[sequelize.literal("count"), "DESC"]],
      limit: 5,
    });

    const topUsers = topUsersRaw.map((row) => ({
      user: {
        id: row.User.id,
        name: `${row.User.firstName} ${row.User.lastName}`,
        email: row.User.email,
      },
      count: parseInt(row.get("count"), 10),
    }));

    res.json({
      success: true,
      data: {
        period,
        stats: { total, success, failed, successRate },
        topActions: topActions.map((a) => ({
          action: a.action,
          count: parseInt(a.count, 10),
        })),
        topUsers,
      },
    });
  } catch (error) {
    console.error("Get audit stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques d'audit",
    });
  }
};

exports.getAuditLogDetail = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, {
      include: auditLogIncludes,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log d'audit introuvable",
      });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    console.error("Get audit log detail error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du détail",
    });
  }
};

exports.exportAuditCsv = async (req, res) => {
  try {
    const { ids } = req.query;
    const hasSelection = ids !== undefined;
    const selectedIds = [
      ...new Set(
        hasSelection
          ? String(ids)
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : []
      ),
    ];

    if (hasSelection && selectedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun log sélectionné pour l'export",
      });
    }

    if (selectedIds.length > 500) {
      return res.status(400).json({
        success: false,
        message: "La sélection est limitée à 500 logs par export",
      });
    }

    const where =
      selectedIds.length > 0
        ? { id: { [Op.in]: selectedIds } }
        : buildAuditWhere(req.query);

    const total = await AuditLog.count({ where });
    if (total > EXPORT_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `L'export est limité à ${EXPORT_LIMIT} lignes. Affinez vos filtres.`,
      });
    }

    const rows = await AuditLog.findAll({
      where,
      include: auditLogIncludes,
      order: [["createdAt", "DESC"]],
    });

    const header = [
      "Date",
      "Utilisateur",
      "Email",
      "Action",
      "Ressource",
      "ID ressource",
      "Statut",
      "Détails",
      "Adresse IP",
      "Message d'erreur",
    ];

    const csvLines = [
      header.map(escapeCsvValue).join(";"),
      ...rows.map((log) => {
        const actor = getActorLabel(log);

        return [
          log.createdAt ? new Date(log.createdAt).toISOString() : "",
          actor.name,
          actor.email,
          ACTION_LABELS[log.action] || log.action,
          RESOURCE_LABELS[log.resource] || log.resource,
          log.resourceId ?? "",
          log.success ? "Réussie" : "Échouée",
          log.details ?? "",
          log.ipAddress ?? "",
          log.errorMessage ?? "",
        ]
          .map(escapeCsvValue)
          .join(";");
      }),
    ];

    const filename = `${selectedIds.length > 0 ? "audit-selection" : "audit"}-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(`\uFEFF${csvLines.join("\r\n")}`);
  } catch (error) {
    console.error("Export audit CSV error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'export CSV du journal d'audit",
    });
  }
};
