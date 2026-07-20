// routes/scanRoute.js

const express = require("express");
const scanController = require("../controllers/scanController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Scan
 *   description: Scan de cartes NFC (routes publiques)
 */

/**
 * @swagger
 * /api/scan/card/{token}:
 *   get:
 *     tags: [Scan]
 *     summary: Récupérer les informations d'une carte et ses services disponibles
 *     description: Route publique pour afficher la page de scan avec sélection de service
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token unique de la carte (scanToken)
 *     responses:
 *       200:
 *         description: Informations de la carte, entreprise et services disponibles
 *       404:
 *         description: Carte introuvable
 */
router.get("/card/:token", scanController.getCardInfo);

/**
 * @swagger
 * /api/scan/identify-client:
 *   post:
 *     tags: [Scan]
 *     summary: Identifier un client via téléphone ou email
 *     description: Route publique — fallback quand la carte n'est pas assignée à un client
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scanToken]
 *             properties:
 *               scanToken:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client trouvé ou non (found: boolean)
 *       400:
 *         description: Données manquantes
 */
router.post("/identify-client", scanController.identifyClient);

/**
 * @swagger
 * /api/scan/validate-service:
 *   post:
 *     tags: [Scan]
 *     summary: Valider un scan avec sélection de service
 *     description: Route publique pour enregistrer un scan après sélection du service
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scanToken, cardCode, serviceId]
 *             properties:
 *               scanToken:
 *                 type: string
 *               cardCode:
 *                 type: string
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scan validé avec succès
 *       400:
 *         description: Données manquantes ou invalides
 *       404:
 *         description: Carte ou service introuvable
 */
router.post("/validate-service", scanController.validateServiceScan);

/**
 * @swagger
 * /api/scan/redeem-reward:
 *   post:
 *     tags: [Scan]
 *     summary: Utiliser une récompense depuis la page scan
 *     description: Route publique — vérifie le cardCode, déduit les points et crée un Redemption
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scanToken, cardCode, rewardId, clientId]
 *             properties:
 *               scanToken:
 *                 type: string
 *               cardCode:
 *                 type: string
 *               rewardId:
 *                 type: string
 *                 format: uuid
 *               clientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Récompense utilisée, points déduits
 *       400:
 *         description: Points insuffisants ou stock épuisé
 *       404:
 *         description: Carte, client ou récompense introuvable
 */
router.post("/redeem-reward", scanController.redeemRewardScan);

module.exports = router;
