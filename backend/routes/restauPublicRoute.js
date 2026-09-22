const express = require("express");
const restaurantMenuController = require("../controllers/restaurantMenuController");

const router = express.Router();

router.get("/menu/:enterpriseId", restaurantMenuController.getPublicMenu);

module.exports = router;
