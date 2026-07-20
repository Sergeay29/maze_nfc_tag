// routes/enterpriseRoute.js

const express = require("express");
const router = express.Router();
const enterpriseController = require("../controllers/enterpriseController");
const { authenticate, requireRole } = require("../middlewares/authMiddleware");

// Toutes les routes /api/enterprise/* exigent d'être authentifié
router.use(authenticate);
router.use(requireRole("OWNER", "MANAGER", "EMPLOYEE"));

/**
 * @swagger
 * tags:
 *   name: Enterprise
 *   description: Espace entreprise — données de l'entreprise connectée
 */

// ─────────────────────────────────────────────────────────────
// ENTERPRISE (ME)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/enterprise/me:
 *   get:
 *     tags: [Enterprise]
 *     summary: Données de l'entreprise de l'utilisateur connecté
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Données complètes de l'entreprise
 *       404:
 *         description: Aucune entreprise associée au compte
 */
router.get("/me", enterpriseController.getMyEnterprise);

/**
 * @swagger
 * /api/enterprise/me:
 *   put:
 *     tags: [Enterprise]
 *     summary: Mettre à jour les informations de l'entreprise connectée
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               location: { type: string }
 *               logo: { type: string }
 *               adminFirstName: { type: string }
 *               adminLastName: { type: string }
 *     responses:
 *       200:
 *         description: Informations mises à jour
 *       404:
 *         description: Aucune entreprise associée au compte
 */
router.put("/me", enterpriseController.updateMyEnterprise);

/**
 * @swagger
 * /api/enterprise/dashboard:
 *   get:
 *     tags: [Enterprise]
 *     summary: Dashboard de l'entreprise connectée
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques et données du dashboard
 */
router.get("/dashboard", enterpriseController.getDashboard);

// ─────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/enterprise/clients:
 *   get:
 *     tags: [Enterprise]
 *     summary: Liste des clients de l'entreprise
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste paginée des clients
 */
router.get("/clients", enterpriseController.getClients);

/**
 * @swagger
 * /api/enterprise/clients/{id}:
 *   get:
 *     tags: [Enterprise]
 *     summary: Détail d'un client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Détails du client avec ses scans
 */
router.get("/clients/:id", enterpriseController.getClientById);

/**
 * @swagger
 * /api/enterprise/clients:
 *   post:
 *     tags: [Enterprise]
 *     summary: Créer un nouveau client
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               photo: { type: string }
 *     responses:
 *       201:
 *         description: Client créé
 */
router.post("/clients", enterpriseController.createClient);

/**
 * @swagger
 * /api/enterprise/clients/{id}:
 *   put:
 *     tags: [Enterprise]
 *     summary: Mettre à jour un client
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               photo: { type: string }
 *               status: { type: string }
 *               level: { type: string }
 *     responses:
 *       200:
 *         description: Client mis à jour
 */
router.put("/clients/:id", enterpriseController.updateClient);

// ─────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/enterprise/services:
 *   get:
 *     tags: [Enterprise]
 *     summary: Liste des services de l'entreprise
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des services
 */
router.get("/services", enterpriseController.getServices);

/**
 * @swagger
 * /api/enterprise/services/{id}:
 *   get:
 *     tags: [Enterprise]
 *     summary: Détail d'un service
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Détails du service
 */
router.get("/services/:id", enterpriseController.getServiceById);

/**
 * @swagger
 * /api/enterprise/services:
 *   post:
 *     tags: [Enterprise]
 *     summary: Créer un nouveau service
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, pointsToAdd]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               pointsToAdd: { type: integer }
 *               icon: { type: string }
 *               color: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Service créé
 */
router.post("/services", enterpriseController.createService);

/**
 * @swagger
 * /api/enterprise/services/{id}:
 *   put:
 *     tags: [Enterprise]
 *     summary: Mettre à jour un service
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               pointsToAdd: { type: integer }
 *               icon: { type: string }
 *               color: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Service mis à jour
 */
router.put("/services/:id", enterpriseController.updateService);

/**
 * @swagger
 * /api/enterprise/services/{id}:
 *   delete:
 *     tags: [Enterprise]
 *     summary: Supprimer un service
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Service supprimé
 */
router.delete("/services/:id", enterpriseController.deleteService);

// ─────────────────────────────────────────────────────────────
// REWARDS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/enterprise/rewards:
 *   get:
 *     tags: [Enterprise]
 *     summary: Liste des récompenses de l'entreprise
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des récompenses
 */
router.get("/rewards", enterpriseController.getRewards);

/**
 * @swagger
 * /api/enterprise/rewards/{id}:
 *   get:
 *     tags: [Enterprise]
 *     summary: Détail d'une récompense
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Détails de la récompense
 */
router.get("/rewards/:id", enterpriseController.getRewardById);

/**
 * @swagger
 * /api/enterprise/rewards:
 *   post:
 *     tags: [Enterprise]
 *     summary: Créer une nouvelle récompense
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, pointsRequired]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               pointsRequired: { type: integer }
 *               image: { type: string }
 *               category: { type: string }
 *               isActive: { type: boolean }
 *               stock: { type: integer }
 *     responses:
 *       201:
 *         description: Récompense créée
 */
router.post("/rewards", enterpriseController.createReward);

/**
 * @swagger
 * /api/enterprise/rewards/{id}:
 *   put:
 *     tags: [Enterprise]
 *     summary: Mettre à jour une récompense
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               pointsRequired: { type: integer }
 *               image: { type: string }
 *               category: { type: string }
 *               isActive: { type: boolean }
 *               stock: { type: integer }
 *     responses:
 *       200:
 *         description: Récompense mise à jour
 */
router.put("/rewards/:id", enterpriseController.updateReward);

/**
 * @swagger
 * /api/enterprise/rewards/{id}:
 *   delete:
 *     tags: [Enterprise]
 *     summary: Supprimer une récompense
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Récompense supprimée
 */
router.delete("/rewards/:id", enterpriseController.deleteReward);

// ─────────────────────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/enterprise/cards:
 *   get:
 *     tags: [Enterprise]
 *     summary: Liste des cartes de l'entreprise
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste paginée des cartes
 */
router.get("/cards", enterpriseController.getCards);
router.put("/cards/:id/assign", enterpriseController.assignCard);
router.patch("/cards/:id/status", enterpriseController.updateCardStatus);

// ─────────────────────────────────────────────────────────────
// SCANS & POINTS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/enterprise/scan:
 *   post:
 *     tags: [Enterprise]
 *     summary: Scanner une carte NFC
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardCode]
 *             properties:
 *               cardCode: { type: string }
 *               serviceId: { type: string, format: uuid }
 *               notes: { type: string }
 *               manualPoints: { type: integer }
 *     responses:
 *       201:
 *         description: Scan enregistré, points ajoutés si applicable
 */
router.post("/scan", enterpriseController.scanCard);

/**
 * @swagger
 * /api/enterprise/scans:
 *   get:
 *     tags: [Enterprise]
 *     summary: Liste des scans de l'entreprise
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste paginée des scans
 */
router.get("/scans", enterpriseController.getScans);

/**
 * @swagger
 * /api/enterprise/points/adjust:
 *   post:
 *     tags: [Enterprise]
 *     summary: Ajuster les points d'un client manuellement
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, points]
 *             properties:
 *               clientId: { type: string, format: uuid }
 *               points: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Points ajustés
 */
router.post("/points/adjust", enterpriseController.adjustPoints);

module.exports = router;
