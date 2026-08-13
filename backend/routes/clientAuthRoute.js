const express = require("express");
const clientAuthController = require("../controllers/clientAuthController");
const { authenticateClient } = require("../middlewares/clientAuthMiddleware");

const router = express.Router();

router.post("/login", clientAuthController.login);
router.post("/forgot-password", clientAuthController.forgotPassword);
router.post("/reset-password", clientAuthController.resetPassword);
router.get("/me", authenticateClient, clientAuthController.me);

module.exports = router;
