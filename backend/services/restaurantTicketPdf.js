function toPdfText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value, maxLength = 76) {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function buildPageContent(lines) {
  const commands = ["BT", "/F1 15 Tf", "50 800 Td"];
  lines.forEach((line, index) => {
    if (index > 0) commands.push("0 -18 Td");
    commands.push(`(${toPdfText(line)}) Tj`);
  });
  commands.push("ET");
  return commands.join("\n");
}

function buildPdf(pages) {
  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const pageNumber = pageObjectNumbers[index];
    const contentNumber = pageNumber + 1;
    const content = buildPageContent(pageLines);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNumber} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`);
  });

  const chunks = [Buffer.from("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n", "binary")];
  const offsets = [0];
  let position = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(position);
    const chunk = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, "ascii");
    chunks.push(chunk);
    position += chunk.length;
  });
  const xrefPosition = position;
  const xref = [`xref`, `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let index = 1; index < offsets.length; index += 1) xref.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  xref.push("trailer", `<< /Size ${objects.length + 1} /Root 1 0 R >>`, "startxref", String(xrefPosition), "%%EOF");
  chunks.push(Buffer.from(`${xref.join("\n")}\n`, "ascii"));
  return Buffer.concat(chunks);
}

function buildRestaurantOrderTicketPdf({ order, restaurantName }) {
  const lines = [
    restaurantName || "Restaurant",
    "TICKET DE COMMANDE",
    `Reference : ${order.publicOrderToken.slice(0, 8).toUpperCase()}`,
    `Date : ${new Date(order.createdAt).toLocaleString("fr-FR")}`,
    `Statut : ${order.status}`,
    order.tableReference ? `Table : ${order.tableReference}` : "A emporter",
    order.contact ? `Contact : ${order.contact}` : "",
    "----------------------------------------",
  ];
  for (const item of order.items || []) {
    lines.push(`${item.quantity} x ${item.nameSnapshot}`);
    for (const option of item.selectedOptionsSnapshot || []) lines.push(`  - ${option.groupName} : ${option.name}${option.priceModifierMinor ? ` (+${option.priceModifierMinor} FCFA)` : ""}`);
    lines.push(`  ${item.unitPriceMinor} FCFA / unite = ${item.lineTotalMinor} FCFA`);
  }
  lines.push("----------------------------------------", `TOTAL : ${order.totalMinor} FCFA`, `Paiement : ${order.paymentStatus}`);
  if (order.customerNote) {
    lines.push("Note client :");
    lines.push(...wrapText(order.customerNote));
  }

  const pageLines = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (index % 42 === 0) pageLines.push([]);
    pageLines[pageLines.length - 1].push(...wrapText(lines[index]));
  }
  return buildPdf(pageLines);
}

module.exports = { buildRestaurantOrderTicketPdf };
