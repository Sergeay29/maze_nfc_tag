const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { Enterprise, Reservation, RestaurantTable, RestaurantReservationSettings } = require("../models");

const DEFAULT_DURATION_MINUTES = 90;
const DEFAULT_TURNOVER_BUFFER_MINUTES = 15;

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isValidTime(value) {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isFutureOrToday(dateValue) {
  const today = new Date();
  const todayValue = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  return dateValue >= todayValue;
}

function parseSlotStart(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes);
}

function toDateValue(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseBoundedInteger(value, minimum, maximum) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function validateReservationInput(body, { requireContact = true } = {}) {
  const reservationDate = typeof body.reservationDate === "string" ? body.reservationDate.trim() : "";
  const reservationTime = typeof body.reservationTime === "string" ? body.reservationTime.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const partySize = Number(body.partySize);

  if (!isValidDate(reservationDate) || !isFutureOrToday(reservationDate)) {
    return { error: "La date de réservation doit être valide et actuelle ou future" };
  }
  if (!isValidTime(reservationTime)) return { error: "L'heure de réservation est invalide" };
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 100) {
    return { error: "Le nombre de couverts doit être compris entre 1 et 100" };
  }
  if (requireContact && (contact.length < 2 || contact.length > 160)) {
    return { error: "Un contact valide est obligatoire" };
  }
  return { data: { reservationDate, reservationTime, partySize, contact } };
}

async function getReservationSettings(enterpriseId, transaction) {
  const settings = await RestaurantReservationSettings.findByPk(enterpriseId, { transaction });
  return settings || {
    enterpriseId,
    defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
    turnoverBufferMinutes: DEFAULT_TURNOVER_BUFFER_MINUTES,
    allowPublicBookings: true,
  };
}

async function findAvailableTable({ enterpriseId, reservationDate, reservationTime, partySize, settings, transaction }) {
  const requestedStart = parseSlotStart(reservationDate, reservationTime);
  const requestedEnd = requestedStart + (settings.defaultDurationMinutes + settings.turnoverBufferMinutes) * 60 * 1000;
  const tableOptions = {
    where: { enterpriseId, status: "active", capacity: { [Op.gte]: partySize } },
    order: [["capacity", "ASC"], ["sortOrder", "ASC"], ["label", "ASC"]],
    transaction,
  };
  if (transaction) tableOptions.lock = transaction.LOCK.UPDATE;
  const tables = await RestaurantTable.findAll(tableOptions);
  if (!tables.length) return { table: null, availableTables: 0 };

  const datesToInspect = [...new Set([
    toDateValue(requestedStart - 24 * 60 * 60 * 1000),
    reservationDate,
    toDateValue(requestedEnd),
  ])];
  const reservations = await Reservation.findAll({
    where: {
      enterpriseId,
      reservationDate: { [Op.in]: datesToInspect },
      status: { [Op.in]: ["pending", "confirmed"] },
      tableId: { [Op.ne]: null },
    },
    attributes: ["tableId", "reservationDate", "reservationTime", "durationMinutes", "turnoverBufferMinutes"],
    transaction,
  });
  const occupiedTableIds = new Set();
  for (const reservation of reservations) {
    const reservationStart = parseSlotStart(reservation.reservationDate, reservation.reservationTime);
    const reservationEnd = reservationStart + ((reservation.durationMinutes || DEFAULT_DURATION_MINUTES) + (reservation.turnoverBufferMinutes || 0)) * 60 * 1000;
    if (requestedStart < reservationEnd && requestedEnd > reservationStart) occupiedTableIds.add(reservation.tableId);
  }
  const availableTables = tables.filter((table) => !occupiedTableIds.has(table.id));
  return { table: availableTables[0] || null, availableTables: availableTables.length };
}

exports.getPublicAvailability = async (req, res) => {
  try {
    const enterprise = await Enterprise.findOne({ where: { id: req.params.enterpriseId, status: "active" }, attributes: ["id"] });
    if (!enterprise) return res.status(404).json({ success: false, message: "Restaurant introuvable" });
    const validation = validateReservationInput(req.query, { requireContact: false });
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    const settings = await getReservationSettings(enterprise.id);
    if (!settings.allowPublicBookings) return res.json({ success: true, data: { available: false, availableTables: 0 } });
    const availability = await findAvailableTable({ enterpriseId: enterprise.id, ...validation.data, settings });
    return res.json({ success: true, data: { available: Boolean(availability.table), availableTables: availability.availableTables } });
  } catch (error) {
    console.error("Get public reservation availability error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la vérification des disponibilités" });
  }
};

exports.createPublicReservation = async (req, res) => {
  try {
    const enterprise = await Enterprise.findOne({ where: { id: req.params.enterpriseId, status: "active" }, attributes: ["id"] });
    if (!enterprise) return res.status(404).json({ success: false, message: "Restaurant introuvable" });
    const validation = validateReservationInput(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const reservation = await sequelize.transaction(async (transaction) => {
      const settings = await getReservationSettings(enterprise.id, transaction);
      if (!settings.allowPublicBookings) {
        const error = new Error("Les réservations en ligne ne sont pas disponibles pour ce restaurant");
        error.statusCode = 403;
        throw error;
      }
      const availability = await findAvailableTable({ enterpriseId: enterprise.id, ...validation.data, settings, transaction });
      if (!availability.table) {
        const error = new Error("Aucune table adaptée n'est disponible pour ce créneau");
        error.statusCode = 409;
        throw error;
      }
      return Reservation.create({
        enterpriseId: enterprise.id,
        tableId: availability.table.id,
        ...validation.data,
        durationMinutes: settings.defaultDurationMinutes,
        turnoverBufferMinutes: settings.turnoverBufferMinutes,
        source: "table",
        status: "pending",
      }, { transaction });
    });

    return res.status(201).json({
      success: true,
      message: "Demande de réservation envoyée",
      data: { id: reservation.id, status: reservation.status },
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error("Create public reservation error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement de la réservation" });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { enterpriseId: req.user.enterpriseId },
      include: [{ model: RestaurantTable, as: "table", attributes: ["id", "label", "capacity", "zone"] }],
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

exports.getReservationSettings = async (req, res) => {
  try {
    const settings = await getReservationSettings(req.user.enterpriseId);
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get reservation settings error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des réglages de réservation" });
  }
};

exports.updateReservationSettings = async (req, res) => {
  try {
    const defaultDurationMinutes = parseBoundedInteger(req.body.defaultDurationMinutes, 15, 720);
    const turnoverBufferMinutes = parseBoundedInteger(req.body.turnoverBufferMinutes, 0, 180);
    if (defaultDurationMinutes === null || turnoverBufferMinutes === null || typeof req.body.allowPublicBookings !== "boolean") {
      return res.status(400).json({ success: false, message: "Réglages de réservation invalides" });
    }
    const [settings] = await RestaurantReservationSettings.upsert({
      enterpriseId: req.user.enterpriseId,
      defaultDurationMinutes,
      turnoverBufferMinutes,
      allowPublicBookings: req.body.allowPublicBookings,
    }, { returning: true });
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Update reservation settings error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour des réglages de réservation" });
  }
};
