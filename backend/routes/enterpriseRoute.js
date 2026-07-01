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

module.exports = router;
