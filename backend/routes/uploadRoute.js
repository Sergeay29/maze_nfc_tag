// routes/uploadRoute.js

const express = require("express");
const router = express.Router();
const { upload } = require("../config/upload");
const { authenticate, requireRole } = require("../middlewares/authMiddleware");
const { logFromReq, AUDIT_ACTIONS } = require("../services/auditService");

/**
 * @swagger
 * /api/upload/logo:
 *   post:
 *     tags: [Admin]
 *     summary: Uploader un logo (image) — stockage local dans /uploads
 *     description: Accepte JPG, PNG, WEBP, GIF — max 5 MB. Retourne l'URL locale.
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
 *                     url: { type: string, example: "http://localhost:3000/cards/uploads/file-1234567890.jpg" }
 *       400:
 *         description: Fichier manquant ou format invalide
 */
router.post(
  "/logo",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier reçu ou format non supporté.",
      });
    }

    const protocol = req.protocol;
    const host = req.get("host");

    const publicAppUrl = (
      process.env.PUBLIC_APP_URL ||
      `${protocol}://${host}`
    ).replace(/\/+$/, "");

    const fileUrl =
      `${publicAppUrl}/uploads/${req.file.filename}`;

    await logFromReq(req, {
      action: AUDIT_ACTIONS.UPLOAD_LOGO,
      resource: "enterprise",
      resourceId: req.user?.enterpriseId ?? null,
      details: `Upload logo : ${req.file.filename}`,
      newValues: { url: fileUrl },
      success: true,
    });

    return res.json({
      success: true,
      data: { url: fileUrl },
    });
  }
);

// Gestion des erreurs multer
router.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Fichier trop lourd (max 5 MB)." });
  }
  return res.status(400).json({ success: false, message: err.message });
});

module.exports = router;
