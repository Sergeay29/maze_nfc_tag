const express = require("express");
const restaurantMenuController = require("../controllers/restaurantMenuController");
const restaurantReservationController = require("../controllers/restaurantReservationController");
const restaurantOrderController = require("../controllers/restaurantOrderController");

const router = express.Router();

router.get("/menu/:enterpriseId", restaurantMenuController.getPublicMenu);
router.post("/menu/:enterpriseId/reservations", restaurantReservationController.createPublicReservation);
router.post("/menu/:enterpriseId/orders", restaurantOrderController.createPublicOrder);
router.get("/orders/:token", restaurantOrderController.getPublicOrder);

module.exports = router;
