// routes/uploadRoute.js

const express = require("express");
const router = express.Router();
const path = require("path");
const upload = require("../config/upload");
const { authenticate, requireRole } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/upload/logo:
 *   post:
 *     tags: [Admin]
 *     summary: Uploader un logo (image) — stockage local
 *     description: Accepte JPG, PNG, WEBP, GIF — max 2 MB. Retourne l'URL publique.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: URL du fichier uploadé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string, example: "http://localhost:3000/uploads/1234567890-abc.png" }
 *       400:
 *         description: Fichier manquant ou format invalide
 */
router.post(
  "/logo",
  authenticate,
  requireRole("SUPER_ADMIN"),
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier reçu ou format non supporté.",
      });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      data: { url },
    });
  }
);

// Gestion des erreurs multer
router.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Fichier trop lourd (max 2 MB)." });
  }
  return res.status(400).json({ success: false, message: err.message });
});

module.exports = router;
