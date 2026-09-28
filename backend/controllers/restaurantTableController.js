const { Op } = require("sequelize");
const { RestaurantTable } = require("../models");

function getEnterpriseId(req) {
  return req.user?.enterpriseId || null;
}

function normalizeLabel(value) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function normalizeZone(value) {
  return typeof value === "string" ? value.trim().slice(0, 80) || null : null;
}

function parseCapacity(value) {
  const capacity = Number(value);
  return Number.isInteger(capacity) && capacity >= 1 && capacity <= 100 ? capacity : null;
}

exports.getTables = async (req, res) => {
  try {
    const tables = await RestaurantTable.findAll({
      where: { enterpriseId: getEnterpriseId(req) },
      order: [["sortOrder", "ASC"], ["label", "ASC"]],
    });
    return res.json({ success: true, data: tables });
  } catch (error) {
    console.error("Get restaurant tables error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des tables" });
  }
};

exports.createTable = async (req, res) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const label = normalizeLabel(req.body.label);
    const capacity = parseCapacity(req.body.capacity);
    if (!label || !capacity) return res.status(400).json({ success: false, message: "Libellé et capacité valides obligatoires" });

    const duplicate = await RestaurantTable.findOne({ where: { enterpriseId, label } });
    if (duplicate) return res.status(409).json({ success: false, message: "Une table porte déjà ce nom" });

    const table = await RestaurantTable.create({ enterpriseId, label, zone: normalizeZone(req.body.zone), capacity, status: "active", sortOrder: Number(req.body.sortOrder) || 0 });
    return res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error("Create restaurant table error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la création de la table" });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const table = await RestaurantTable.findOne({ where: { id: req.params.id, enterpriseId } });
    if (!table) return res.status(404).json({ success: false, message: "Table introuvable" });

    const label = req.body.label === undefined ? table.label : normalizeLabel(req.body.label);
    const capacity = req.body.capacity === undefined ? table.capacity : parseCapacity(req.body.capacity);
    const zone = req.body.zone === undefined ? table.zone : normalizeZone(req.body.zone);
    const status = req.body.status === undefined ? table.status : req.body.status;
    if (!label || !capacity || !["active", "inactive"].includes(status)) return res.status(400).json({ success: false, message: "Données de table invalides" });

    const duplicate = await RestaurantTable.findOne({ where: { enterpriseId, label, id: { [Op.ne]: table.id } } });
    if (duplicate) return res.status(409).json({ success: false, message: "Une table porte déjà ce nom" });

    await table.update({ label, zone, capacity, status, sortOrder: req.body.sortOrder === undefined ? table.sortOrder : Number(req.body.sortOrder) || 0 });
    return res.json({ success: true, data: table });
  } catch (error) {
    console.error("Update restaurant table error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour de la table" });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({ where: { id: req.params.id, enterpriseId: getEnterpriseId(req) } });
    if (!table) return res.status(404).json({ success: false, message: "Table introuvable" });
    await table.update({ status: "inactive" });
    return res.json({ success: true, data: table });
  } catch (error) {
    console.error("Deactivate restaurant table error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la désactivation de la table" });
  }
};
