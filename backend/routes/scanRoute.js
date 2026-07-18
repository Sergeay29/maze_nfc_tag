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
 *                 description: Token de la carte
 *               cardCode:
 *                 type: string
 *                 description: Code physique de la carte (ex ABC123)
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du service sélectionné
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone du client
 *               email:
 *                 type: string
 *                 description: Email du client
 *               name:
 *                 type: string
 *                 description: Nom du client (pour nouveau client)
 *     responses:
 *       201:
 *         description: Scan validé avec succès
 *       400:
 *         description: Données manquantes ou invalides
 *       404:
 *         description: Carte ou service introuvable
 */
router.post("/validate-service", scanController.validateServiceScan);

module.exports = router;
