// routes/adminRoute.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, requireRole } = require("../middlewares/authMiddleware");

// Toutes les routes /api/admin/* exigent d'être authentifié ET SUPER_ADMIN
router.use(authenticate);
router.use(requireRole("SUPER_ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Espace Super Admin Maze NFC — toutes les routes nécessitent un token SUPER_ADMIN
 */

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Statistiques globales du dashboard
 *     description: Retourne les stats clés, les tendances de scans sur 7 jours, la répartition des cartes et les 5 derniers scans.
 *     responses:
 *       200:
 *         description: Données du dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         activeEnterprises: { type: integer, example: 4 }
 *                         totalCards: { type: integer, example: 50 }
 *                         scansThisMonth: { type: integer, example: 100 }
 *                         monthlyRevenue: { type: number, example: 326 }
 *                     scanTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           day: { type: string, example: "Lun" }
 *                           scans: { type: integer }
 *                     cardStatusBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           value: { type: integer }
 *                           color: { type: string }
 *                     recentScans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Scan'
 */
router.get("/dashboard", adminController.getDashboard);

// ─────────────────────────────────────────────────────────────
// ENTREPRISES
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/enterprises:
 *   get:
 *     tags: [Admin]
 *     summary: Liste des entreprises
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
 *         description: Recherche sur nom ou email
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, active, suspended] }
 *     responses:
 *       200:
 *         description: Liste paginée des entreprises
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/PaginatedMeta'
 *                     - type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Enterprise'
 */
router.get("/enterprises", adminController.getEnterprises);

/**
 * @swagger
 * /api/admin/enterprises/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Détail d'une entreprise
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Détail de l'entreprise avec cartes, clients et scans
 *       404:
 *         description: Entreprise non trouvée
 */
router.get("/enterprises/:id", adminController.getEnterpriseDetail);

/**
 * @swagger
 * /api/admin/enterprises:
 *   post:
 *     tags: [Admin]
 *     summary: Créer une nouvelle entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEnterpriseRequest'
 *     responses:
 *       201:
 *         description: Entreprise créée avec son abonnement
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/enterprises", adminController.createEnterprise);

/**
 * @swagger
 * /api/admin/enterprises/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Mettre à jour une entreprise (dont activation/suspension)
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
 *             $ref: '#/components/schemas/UpdateEnterpriseRequest'
 *     responses:
 *       200:
 *         description: Entreprise mise à jour
 *       404:
 *         description: Entreprise non trouvée
 */
router.put("/enterprises/:id", adminController.updateEnterprise);

/**
 * @swagger
 * /api/admin/enterprises/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Supprimer une entreprise et toutes ses données liées
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Entreprise supprimée
 *       404:
 *         description: Entreprise non trouvée
 */
router.delete("/enterprises/:id", adminController.deleteEnterprise);

// ─────────────────────────────────────────────────────────────
// CARTES NFC
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/cards:
 *   get:
 *     tags: [Admin]
 *     summary: Liste de toutes les cartes NFC
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, unassigned] }
 *       - in: query
 *         name: enterpriseId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Liste paginée des cartes
 */
router.get("/cards", adminController.getCards);

/**
 * @swagger
 * /api/admin/cards/unassigned:
 *   get:
 *     tags: [Admin]
 *     summary: Cartes non attribuées (pour le formulaire d'attribution)
 *     parameters:
 *       - in: query
 *         name: enterpriseId
 *         schema: { type: string, format: uuid }
 *         description: Filtrer par entreprise
 *     responses:
 *       200:
 *         description: Liste des cartes non attribuées
 */
router.get("/cards/unassigned", adminController.getUnassignedCards);

/**
 * @swagger
 * /api/admin/cards/generate:
 *   post:
 *     tags: [Admin]
 *     summary: Générer des cartes NFC en masse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateCardsRequest'
 *     responses:
 *       201:
 *         description: Cartes générées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     generated: { type: integer, example: 10 }
 *       400:
 *         description: Paramètres invalides
 */
router.post("/cards/generate", adminController.generateCards);

/**
 * @swagger
 * /api/admin/cards/assign:
 *   post:
 *     tags: [Admin]
 *     summary: Attribuer une carte NFC à un client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignCardRequest'
 *     responses:
 *       201:
 *         description: Carte attribuée, client créé
 *       404:
 *         description: Carte introuvable ou déjà attribuée
 */
router.post("/cards/assign", adminController.assignCard);

// ─────────────────────────────────────────────────────────────
// SCANS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/scans:
 *   get:
 *     tags: [Admin]
 *     summary: Liste des scans
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
 *         description: Recherche par nom de client
 *       - in: query
 *         name: enterpriseId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Liste paginée des scans avec client, carte et entreprise aplatis
 */
router.get("/scans", adminController.getScans);

// ─────────────────────────────────────────────────────────────
// ABONNEMENTS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/subscriptions:
 *   get:
 *     tags: [Admin]
 *     summary: Liste des abonnements
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: plan
 *         schema: { type: string, enum: [Starter, Pro, Enterprise] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, paused, cancelled] }
 *     responses:
 *       200:
 *         description: Liste paginée des abonnements avec stats revenus
 */
router.get("/subscriptions", adminController.getSubscriptions);

/**
 * @swagger
 * /api/admin/subscriptions/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Mettre à jour un abonnement (plan ou statut)
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
 *               plan:
 *                 type: string
 *                 enum: [Starter, Pro, Enterprise]
 *               status:
 *                 type: string
 *                 enum: [active, paused, cancelled]
 *     responses:
 *       200:
 *         description: Abonnement mis à jour
 *       404:
 *         description: Abonnement non trouvé
 */
router.put("/subscriptions/:id", adminController.updateSubscription);

// ─────────────────────────────────────────────────────────────
// UTILISATEURS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Liste des utilisateurs de la plateforme
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
 *         description: Recherche sur prénom, nom ou email
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs (mot de passe exclu)
 */
router.get("/users", adminController.getUsers);

// ─────────────────────────────────────────────────────────────
// PARAMÈTRES
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Récupérer les paramètres de la plateforme
 *     description: Retourne les paramètres groupés par catégorie (general, notifications, security).
 *     responses:
 *       200:
 *         description: Paramètres groupés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/SettingItem'
 */
router.get("/settings", adminController.getSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     tags: [Admin]
 *     summary: Mettre à jour les paramètres
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [settings]
 *             properties:
 *               settings:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   platform_name: "Maze NFC"
 *                   support_email: "support@mazenfc.com"
 *                   notify_email_alerts: "true"
 *     responses:
 *       200:
 *         description: Paramètres mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated: { type: integer, example: 3 }
 */
router.put("/settings", adminController.updateSettings);

module.exports = router;
