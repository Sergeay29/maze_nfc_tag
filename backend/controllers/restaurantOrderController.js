const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  Enterprise,
  Menu,
  MenuCategory,
  MenuItem,
  MenuItemOptionGroup,
  MenuItemOption,
  RestaurantOrder,
  RestaurantOrderItem,
} = require("../models");
const { buildRestaurantOrderTicketPdf } = require("../services/restaurantTicketPdf");

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
      selectedOptionsSnapshot: item.selectedOptionsSnapshot || [],
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

    const requestedLines = [];
    for (const line of body.items) {
      const menuItemId = typeof line?.menuItemId === "string" ? line.menuItemId : "";
      const quantity = Number(line?.quantity);
      const optionIds = Array.isArray(line?.optionIds) ? line.optionIds : [];
      if (!menuItemId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || optionIds.length > 20 || optionIds.some((id) => typeof id !== "string")) {
        return res.status(400).json({ success: false, message: "Un article, une quantité ou une option est invalide" });
      }
      const uniqueOptionIds = [...new Set(optionIds)];
      if (uniqueOptionIds.length !== optionIds.length) {
        return res.status(400).json({ success: false, message: "Une option ne peut être choisie qu'une fois par plat" });
      }
      requestedLines.push({ menuItemId, quantity, optionIds: uniqueOptionIds });
    }

    const requestedItemIds = [...new Set(requestedLines.map((line) => line.menuItemId))];
    const menuItems = await MenuItem.findAll({
      where: { id: { [Op.in]: requestedItemIds }, isAvailable: true },
      attributes: ["id", "name", "priceMinor"],
      include: [
        { model: MenuCategory, as: "category", where: { menuId: menu.id, isActive: true }, required: true },
        {
          model: MenuItemOptionGroup,
          as: "optionGroups",
          required: false,
          include: [{ model: MenuItemOption, as: "options", required: false }],
        },
      ],
    });
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));
    if (menuItemsById.size !== requestedItemIds.length) {
      return res.status(409).json({ success: false, message: "Un ou plusieurs articles ne sont plus disponibles" });
    }

    const mergedLines = new Map();
    for (const requestedLine of requestedLines) {
      const menuItem = menuItemsById.get(requestedLine.menuItemId);
      const selectedOptions = new Map();

      for (const optionGroup of menuItem.optionGroups || []) {
        const optionsById = new Map((optionGroup.options || []).map((option) => [option.id, option]));
        const chosenOptions = requestedLine.optionIds.map((id) => optionsById.get(id)).filter(Boolean);
        const selectedForGroup = chosenOptions.length;
        if (!optionGroup.isActive && selectedForGroup > 0) {
          return res.status(409).json({ success: false, message: "Une option choisie n'est plus disponible" });
        }
        if (optionGroup.isActive && (selectedForGroup < optionGroup.minSelections || selectedForGroup > optionGroup.maxSelections)) {
          return res.status(400).json({ success: false, message: `Le choix « ${optionGroup.name} » est incomplet ou dépasse la limite autorisée` });
        }
        for (const option of chosenOptions) {
          if (!option.isAvailable) {
            return res.status(409).json({ success: false, message: `L'option « ${option.name} » n'est plus disponible` });
          }
          selectedOptions.set(option.id, {
            groupId: optionGroup.id,
            groupName: optionGroup.name,
            optionId: option.id,
            name: option.name,
            priceModifierMinor: option.priceModifierMinor,
          });
        }
      }
      if (selectedOptions.size !== requestedLine.optionIds.length) {
        return res.status(400).json({ success: false, message: "Une option choisie est invalide" });
      }

      const selectedOptionsSnapshot = [...selectedOptions.values()];
      const unitPriceMinor = menuItem.priceMinor + selectedOptionsSnapshot.reduce((total, option) => total + option.priceModifierMinor, 0);
      if (!Number.isSafeInteger(unitPriceMinor)) {
        return res.status(400).json({ success: false, message: "Le montant de la commande est invalide" });
      }
      const mergeKey = `${menuItem.id}:${selectedOptionsSnapshot.map((option) => option.optionId).sort().join(",")}`;
      const existing = mergedLines.get(mergeKey);
      if (existing) {
        existing.quantity += requestedLine.quantity;
        if (existing.quantity > 20) {
          return res.status(400).json({ success: false, message: "La quantité maximale par plat est de 20" });
        }
      } else {
        mergedLines.set(mergeKey, { menuItem, quantity: requestedLine.quantity, unitPriceMinor, selectedOptionsSnapshot });
      }
    }

    const itemRows = [...mergedLines.values()].map(({ menuItem, quantity, unitPriceMinor, selectedOptionsSnapshot }) => ({
      menuItemId: menuItem.id,
      nameSnapshot: menuItem.name,
      unitPriceMinor,
      quantity,
      lineTotalMinor: unitPriceMinor * quantity,
      selectedOptionsSnapshot,
    }));
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

exports.downloadOrderTicket = async (req, res) => {
  try {
    const order = await RestaurantOrder.findOne({
      where: { id: req.params.id, enterpriseId: req.user.enterpriseId },
      include: [{ model: RestaurantOrderItem, as: "items" }, { model: Enterprise, as: "enterprise", attributes: ["name"] }],
    });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable" });
    const pdf = buildRestaurantOrderTicketPdf({ order, restaurantName: order.enterprise?.name });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="ticket-${order.publicOrderToken.slice(0, 8)}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    console.error("Download restaurant order ticket error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération du ticket PDF" });
  }
};
