const { Op } = require("sequelize");
const { Enterprise, Reservation, RestaurantTable } = require("../models");

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

function isValidTime(value) {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isFutureOrToday(dateValue) {
  const today = new Date();
  const todayValue = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  return dateValue >= todayValue;
}

function validateReservationInput(body) {
  const reservationDate = typeof body.reservationDate === "string" ? body.reservationDate.trim() : "";
  const reservationTime = typeof body.reservationTime === "string" ? body.reservationTime.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const partySize = Number(body.partySize);

  if (!isValidDate(reservationDate) || !isFutureOrToday(reservationDate)) {
    return { error: "La date de réservation doit être valide et actuelle ou future" };
  }
  if (!isValidTime(reservationTime)) {
    return { error: "L'heure de réservation est invalide" };
  }
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 100) {
    return { error: "Le nombre de couverts doit être compris entre 1 et 100" };
  }
  if (contact.length < 2 || contact.length > 160) {
    return { error: "Un contact valide est obligatoire" };
  }

  return { data: { reservationDate, reservationTime, partySize, contact } };
}

exports.createPublicReservation = async (req, res) => {
  try {
    const enterprise = await Enterprise.findOne({
      where: { id: req.params.enterpriseId, status: "active" },
      attributes: ["id"],
    });
    if (!enterprise) return res.status(404).json({ success: false, message: "Restaurant introuvable" });

    const validation = validateReservationInput(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const tables = await RestaurantTable.findAll({
      where: { enterpriseId: enterprise.id, status: "active", capacity: { [Op.gte]: validation.data.partySize } },
      order: [["capacity", "ASC"], ["sortOrder", "ASC"]],
    });
    const existingReservations = await Reservation.findAll({
      where: {
        enterpriseId: enterprise.id,
        reservationDate: validation.data.reservationDate,
        reservationTime: validation.data.reservationTime,
        status: { [Op.in]: ["pending", "confirmed"] },
        tableId: { [Op.ne]: null },
      },
      attributes: ["tableId"],
    });
    const occupiedTableIds = new Set(existingReservations.map((reservation) => reservation.tableId));
    const availableTable = tables.find((table) => !occupiedTableIds.has(table.id));

    if (!availableTable) {
      return res.status(409).json({ success: false, message: "Aucune table adaptée n'est disponible pour ce créneau" });
    }

    const reservation = await Reservation.create({
      enterpriseId: enterprise.id,
      tableId: availableTable.id,
      ...validation.data,
      source: "table",
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Demande de réservation envoyée",
      data: { id: reservation.id, status: reservation.status },
    });
  } catch (error) {
    console.error("Create public reservation error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement de la réservation" });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { enterpriseId: req.user.enterpriseId },
      include: [{ model: RestaurantTable, as: "table", attributes: ["id", "label", "capacity"] }],
      order: [["reservationDate", "ASC"], ["reservationTime", "ASC"], ["createdAt", "DESC"]],
    });
    return res.json({ success: true, data: reservations });
  } catch (error) {
    console.error("Get reservations error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des réservations" });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ where: { id: req.params.id, enterpriseId: req.user.enterpriseId } });
    if (!reservation) return res.status(404).json({ success: false, message: "Réservation introuvable" });
    if (!["pending", "confirmed", "cancelled"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Statut de réservation invalide" });
    }

    await reservation.update({ status: req.body.status });
    return res.json({ success: true, data: reservation });
  } catch (error) {
    console.error("Update reservation status error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour de la réservation" });
  }
};
