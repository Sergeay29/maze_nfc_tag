const QRCode = require("qrcode");
const { NFCCard, RestaurantTable, RestaurantOrder } = require("../models");

const qrOptions = {
  errorCorrectionLevel: "M",
  margin: 2,
  width: 640,
};

async function buildQrResponse(card) {
  if (!card.scanUrl) {
    return null;
  }

  return {
    cardId: card.id,
    cardNumber: card.cardNumber,
    cardCode: card.cardCode,
    targetUrl: card.scanUrl,
    qrCodeDataUrl: await QRCode.toDataURL(card.scanUrl, qrOptions),
  };
}

exports.getAdminCardQrCode = async (req, res) => {
  try {
    const card = await NFCCard.findByPk(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, message: "Carte introuvable" });
    }

    const data = await buildQrResponse(card);
    if (!data) {
      return res.status(409).json({ success: false, message: "Cette carte ne possède pas encore d'URL cible" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Generate admin QR code error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération du QR code" });
  }
};

exports.getEnterpriseCardQrCode = async (req, res) => {
  try {
    const card = await NFCCard.findOne({
      where: {
        id: req.params.id,
        enterpriseId: req.user.enterpriseId,
      },
    });

    if (!card) {
      return res.status(404).json({ success: false, message: "Carte introuvable" });
    }

    const data = await buildQrResponse(card);
    if (!data) {
      return res.status(409).json({ success: false, message: "Cette carte ne possède pas encore d'URL cible" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Generate enterprise QR code error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération du QR code" });
  }
};

exports.getEnterpriseTableQrCode = async (req, res) => {
  try {
    const table = await RestaurantTable.findOne({
      where: { id: req.params.id, enterpriseId: req.user.enterpriseId },
    });
    if (!table) return res.status(404).json({ success: false, message: "Table introuvable" });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
    const targetUrl = `${frontendUrl}/restau/table/${table.publicToken}`;
    return res.json({
      success: true,
      data: {
        tableId: table.id,
        tableLabel: table.label,
        targetUrl,
        qrCodeDataUrl: await QRCode.toDataURL(targetUrl, qrOptions),
      },
    });
  } catch (error) {
    console.error("Generate enterprise table QR code error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération du QR code de table" });
  }
};

exports.getEnterpriseOrderQrCode = async (req, res) => {
  try {
    const order = await RestaurantOrder.findOne({
      where: { id: req.params.id, enterpriseId: req.user.enterpriseId },
      attributes: ["id", "publicOrderToken"],
    });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable" });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
    const targetUrl = `${frontendUrl}/restau/order/${order.publicOrderToken}`;
    return res.json({
      success: true,
      data: {
        orderId: order.id,
        publicOrderToken: order.publicOrderToken,
        targetUrl,
        qrCodeDataUrl: await QRCode.toDataURL(targetUrl, qrOptions),
      },
    });
  } catch (error) {
    console.error("Generate enterprise order QR code error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération du QR code de commande" });
  }
};
