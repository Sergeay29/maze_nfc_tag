const express = require("express");
const restaurantMenuController = require("../controllers/restaurantMenuController");
const restaurantReservationController = require("../controllers/restaurantReservationController");

const router = express.Router();

router.get("/menu/:enterpriseId", restaurantMenuController.getPublicMenu);
router.post("/menu/:enterpriseId/reservations", restaurantReservationController.createPublicReservation);

module.exports = router;
