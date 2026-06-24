// routes/adminRoute.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, requireRole } = require("../middlewares/authMiddleware");

// Toutes les routes /api/admin/* exigent d'être authentifié ET SUPER_ADMIN
router.use(authenticate);
router.use(requireRole("SUPER_ADMIN"));

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Enterprises
router.get("/enterprises", adminController.getEnterprises);
router.get("/enterprises/:id", adminController.getEnterpriseDetail);
router.post("/enterprises", adminController.createEnterprise);
router.put("/enterprises/:id", adminController.updateEnterprise);

// Cards
router.get("/cards", adminController.getCards);
router.get("/cards/unassigned", adminController.getUnassignedCards);
router.post("/cards/generate", adminController.generateCards);
router.post("/cards/assign", adminController.assignCard);

// Scans
router.get("/scans", adminController.getScans);

// Subscriptions
router.get("/subscriptions", adminController.getSubscriptions);
router.put("/subscriptions/:id", adminController.updateSubscription);

// Users
router.get("/users", adminController.getUsers);

// Settings
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

module.exports = router;
