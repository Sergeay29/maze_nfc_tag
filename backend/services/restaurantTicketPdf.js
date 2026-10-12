const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

function formatPrice(value) {
  return `${new Intl.NumberFormat("fr-FR").format(value || 0)} FCFA`;
}

function resolveLocalLogo(logoUrl) {
  if (!logoUrl) return null;
  try {
    const pathname = new URL(logoUrl, "http://localhost").pathname;
    const fileName = path.basename(pathname);
    if (!pathname.includes("/uploads/") || !fileName) return null;
    const filePath = path.join(__dirname, "..", "uploads", fileName);
    return fs.existsSync(filePath) ? filePath : null;
  } catch {
    return null;
  }
}

function drawOptionLines(document, item) {
  for (const option of item.selectedOptionsSnapshot || []) {
    const supplement = option.priceModifierMinor ? ` · +${formatPrice(option.priceModifierMinor)}` : "";
    document.font("Helvetica").fontSize(8.5).fillColor("#64748B").text(`${option.groupName} : ${option.name}${supplement}`, 48, document.y + 2, { width: 300 });
  }
}

async function buildRestaurantOrderTicketPdf({ order, restaurantName, restaurantLogo, trackingUrl }) {
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, { errorCorrectionLevel: "M", margin: 1, width: 220 });
  const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A5", margin: 32, info: { Title: `Ticket ${order.publicOrderToken.slice(0, 8).toUpperCase()}`, Author: restaurantName || "Restaurant" } });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.rect(0, 0, document.page.width, 112).fill("#16111A");
    const logoPath = resolveLocalLogo(restaurantLogo);
    if (logoPath) {
      try { document.image(logoPath, 32, 30, { fit: [46, 46] }); } catch { /* Keep the branded fallback. */ }
    } else {
      document.circle(55, 53, 23).fill("#6A35FF");
      document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(17).text("M", 49, 42);
    }
    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(15).text(restaurantName || "Restaurant", 92, 34, { width: 220 });
    document.fillColor("#C4B5FD").font("Helvetica").fontSize(9).text("Ticket de commande", 92, 57);
    document.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10).text(`#${order.publicOrderToken.slice(0, 8).toUpperCase()}`, 92, 74);

    document.y = 136;
    document.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("Votre commande");
    document.moveDown(0.35);
    document.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)));
    if (order.tableReference) document.text(`Table : ${order.tableReference}`);
    else document.text("Commande à emporter");
    if (order.contact) document.text(`Contact : ${order.contact}`);

    document.moveDown(0.8);
    document.strokeColor("#E2E8F0").moveTo(32, document.y).lineTo(document.page.width - 32, document.y).stroke();
    document.moveDown(0.7);

    for (const item of order.items || []) {
      document.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10).text(`${item.quantity} × ${item.nameSnapshot}`, 32, document.y, { width: 245, continued: true });
      document.fillColor("#6A35FF").font("Helvetica-Bold").fontSize(10).text(formatPrice(item.lineTotalMinor), { align: "right" });
      drawOptionLines(document, item);
      document.moveDown(0.65);
    }

    if (order.customerNote) {
      document.fillColor("#475569").font("Helvetica-Bold").fontSize(8.5).text("Note pour la cuisine");
      document.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(order.customerNote, { width: 330 });
      document.moveDown(0.6);
    }

    document.strokeColor("#E2E8F0").moveTo(32, document.y).lineTo(document.page.width - 32, document.y).stroke();
    document.moveDown(0.7);
    document.fillColor("#0F172A").font("Helvetica-Bold").fontSize(14).text("Total", 32, document.y, { continued: true });
    document.fillColor("#6A35FF").text(formatPrice(order.totalMinor), { align: "right" });

    document.moveDown(1.2);
    const qrY = document.y;
    document.image(qrBuffer, 32, qrY, { width: 78, height: 78 });
    document.fillColor("#0F172A").font("Helvetica-Bold").fontSize(9.5).text("Suivre la commande", 124, qrY + 9);
    document.fillColor("#64748B").font("Helvetica").fontSize(8.5).text("Scannez ce QR code pour consulter votre commande.", 124, qrY + 26, { width: 190 });
    document.fillColor("#64748B").font("Helvetica").fontSize(7.5).text(`Code : ${order.publicOrderToken.slice(0, 8).toUpperCase()}`, 124, qrY + 53);

    document.fillColor("#94A3B8").font("Helvetica").fontSize(7.5).text("Merci pour votre confiance.", 32, document.page.height - 45, { align: "center", width: document.page.width - 64 });
    document.end();
  });
}

module.exports = { buildRestaurantOrderTicketPdf };
