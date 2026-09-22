const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  Enterprise,
  Menu,
  MenuCategory,
  MenuItem,
  RestaurantOrder,
  RestaurantOrderItem,
} = require("../models");

const ORDER_STATUSES = ["pending", "accepted", "preparing", "ready", "served", "cancelled"];

function cleanOptionalText(value, maxLength) {
  if (typeof value !== "string") return null;
  const valueTrimmed = value.trim();
  return valueTrimmed ? valueTrimmed.slice(0, maxLength) : null;
}

function serializeOrder(order) {
  return {
    id: order.id,
    publicOrderToken: order.publicOrderToken,
    tableReference: order.tableReference,
    contact: order.contact,
    customerNote: order.customerNote,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalMinor: order.totalMinor,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items || []).map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      nameSnapshot: item.nameSnapshot,
      unitPriceMinor: item.unitPriceMinor,
      quantity: item.quantity,
      lineTotalMinor: item.lineTotalMinor,
    })),
  };
}

const orderInclude = [{ model: RestaurantOrderItem, as: "items" }];

exports.createPublicOrder = async (req, res) => {
  try {
    const body = req.body || {};
    const enterprise = await Enterprise.findOne({
      where: { id: req.params.enterpriseId, status: "active" },
      attributes: ["id"],
    });
    if (!enterprise) return res.status(404).json({ success: false, message: "Restaurant introuvable" });

    const menu = await Menu.findOne({ where: { enterpriseId: enterprise.id, status: "published" }, attributes: ["id"] });
    if (!menu) return res.status(404).json({ success: false, message: "Menu publié introuvable" });

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      return res.status(400).json({ success: false, message: "Le panier doit contenir entre 1 et 50 lignes" });
    }

    const quantities = new Map();
    for (const line of body.items) {
      const menuItemId = typeof line?.menuItemId === "string" ? line.menuItemId : "";
      const quantity = Number(line?.quantity);
      if (!menuItemId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ success: false, message: "Un article ou une quantité est invalide" });
      }
      quantities.set(menuItemId, (quantities.get(menuItemId) || 0) + quantity);
    }

    const menuItems = await MenuItem.findAll({
      where: { id: { [Op.in]: [...quantities.keys()] }, isAvailable: true },
      include: [{ model: MenuCategory, as: "category", where: { menuId: menu.id, isActive: true }, required: true }],
      attributes: ["id", "name", "priceMinor"],
    });
    if (menuItems.length !== quantities.size) {
      return res.status(409).json({ success: false, message: "Un ou plusieurs articles ne sont plus disponibles" });
    }

    const itemRows = menuItems.map((menuItem) => {
      const quantity = quantities.get(menuItem.id);
      return {
        menuItemId: menuItem.id,
        nameSnapshot: menuItem.name,
        unitPriceMinor: menuItem.priceMinor,
        quantity,
        lineTotalMinor: menuItem.priceMinor * quantity,
      };
    });
    const totalMinor = itemRows.reduce((total, item) => total + item.lineTotalMinor, 0);
    if (!Number.isSafeInteger(totalMinor)) {
      return res.status(400).json({ success: false, message: "Le montant de la commande est invalide" });
    }

    const order = await sequelize.transaction(async (transaction) => {
      const createdOrder = await RestaurantOrder.create({
        enterpriseId: enterprise.id,
        publicOrderToken: crypto.randomBytes(20).toString("hex"),
        tableReference: cleanOptionalText(body.tableReference, 80),
        contact: cleanOptionalText(body.contact, 160),
        customerNote: cleanOptionalText(body.customerNote, 1000),
        status: "pending",
        paymentStatus: "unpaid",
        totalMinor,
      }, { transaction });
      await RestaurantOrderItem.bulkCreate(itemRows.map((item) => ({ ...item, orderId: createdOrder.id })), { transaction });
      return RestaurantOrder.findByPk(createdOrder.id, { include: orderInclude, transaction });
    });

    return res.status(201).json({ success: true, message: "Commande envoyée", data: serializeOrder(order) });
  } catch (error) {
    console.error("Create public restaurant order error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement de la commande" });
  }
};

exports.getPublicOrder = async (req, res) => {
  try {
    const order = await RestaurantOrder.findOne({ where: { publicOrderToken: req.params.token }, include: orderInclude });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable" });
    return res.json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error("Get public restaurant order error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération de la commande" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await RestaurantOrder.findAll({
      where: { enterpriseId: req.user.enterpriseId },
      include: orderInclude,
      order: [["createdAt", "DESC"]],
      limit: 100,
    });
    return res.json({ success: true, data: orders.map(serializeOrder) });
  } catch (error) {
    console.error("Get restaurant orders error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des commandes" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await RestaurantOrder.findOne({
      where: { id: req.params.id, enterpriseId: req.user.enterpriseId },
      include: orderInclude,
    });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable" });
    if (!ORDER_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Statut de commande invalide" });
    }

    await order.update({ status: req.body.status });
    return res.json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error("Update restaurant order status error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour de la commande" });
  }
};
