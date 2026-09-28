const sequelize = require("../config/database");
const { Menu, MenuCategory, MenuItem, MenuItemOptionGroup, MenuItemOption } = require("../models");

function normalize(value) {
  return String(value ?? "").trim();
}

function normalizedHeader(value) {
  return normalize(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if (character === "\n" && !quoted) {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => normalize(value))) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.some((value) => normalize(value))) rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows.shift().map(normalizedHeader);
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, normalize(values[index])])))
    .filter((row) => Object.values(row).some(Boolean));
}

function valueFrom(row, aliases) {
  for (const alias of aliases) {
    const value = row[normalizedHeader(alias)];
    if (value) return value;
  }
  return "";
}

function parsePrice(value) {
  const normalized = normalize(value).replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.0+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(normalize(value), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function parseBoolean(value, fallback = true) {
  const normalized = normalize(value).toLowerCase();
  if (!normalized) return fallback;
  return !["0", "false", "non", "no", "inactif", "inactive"].includes(normalized);
}

exports.importMenuCsv = async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: "Sélectionnez un fichier CSV" });
    const rows = parseCsv(req.file.buffer.toString("utf8"));
    if (!rows.length) return res.status(400).json({ success: false, message: "Le fichier CSV est vide ou invalide" });

    const errors = [];
    const normalizedRows = rows.map((row, index) => {
      const categoryName = valueFrom(row, ["category", "categorie", "section"]);
      const itemName = valueFrom(row, ["item", "plat", "dish", "nom du plat"]);
      const priceValue = valueFrom(row, ["price", "prix", "prix fcfa"]);
      const priceMinor = parsePrice(priceValue);
      if (!categoryName) errors.push(`Ligne ${index + 2} : catégorie obligatoire`);
      if (!itemName) errors.push(`Ligne ${index + 2} : plat obligatoire`);
      if (priceMinor === null) errors.push(`Ligne ${index + 2} : prix invalide`);
      const optionName = valueFrom(row, ["option", "choix", "accompagnement", "supplement"]);
      const optionGroupName = valueFrom(row, ["optiongroup", "groupe option", "groupe de choix", "type d accompagnement"]);
      return {
        categoryName,
        categoryDescription: valueFrom(row, ["categorydescription", "description categorie"]),
        categoryOrder: parseInteger(valueFrom(row, ["categoryorder", "ordre categorie"]), 0),
        itemName,
        itemDescription: valueFrom(row, ["itemdescription", "description", "description plat"]),
        priceMinor,
        itemOrder: parseInteger(valueFrom(row, ["itemorder", "ordre plat"]), 0),
        itemAvailable: parseBoolean(valueFrom(row, ["itemavailable", "disponible"])),
        optionGroupName,
        optionGroupType: valueFrom(row, ["optiongrouptype", "type de choix"]).toLowerCase() === "multiple" ? "multiple" : "single",
        optionGroupMin: parseInteger(valueFrom(row, ["optiongroupmin", "choix minimum"]), 0),
        optionGroupMax: parseInteger(valueFrom(row, ["optiongroupmax", "choix maximum"]), 1),
        optionName,
        optionPriceMinor: parsePrice(valueFrom(row, ["optionprice", "prix option", "supplement prix"])) ?? 0,
        optionOrder: parseInteger(valueFrom(row, ["optionorder", "ordre option"]), 0),
        optionAvailable: parseBoolean(valueFrom(row, ["optionavailable", "option disponible"])),
      };
    });
    if (errors.length) return res.status(400).json({ success: false, message: errors.slice(0, 10).join(" | "), errors });

    const result = await sequelize.transaction(async (transaction) => {
      let menu = await Menu.findOne({ where: { enterpriseId: req.user.enterpriseId }, transaction });
      if (menu?.status === "published") {
        const error = new Error("Repassez le menu en brouillon avant de l'importer");
        error.statusCode = 409;
        throw error;
      }
      if (!menu) menu = await Menu.create({ enterpriseId: req.user.enterpriseId, name: "Menu principal", status: "draft" }, { transaction });

      const counts = { categories: 0, items: 0, optionGroups: 0, options: 0 };
      const categoryCache = new Map();
      const itemCache = new Map();
      const groupCache = new Map();
      for (const row of normalizedRows) {
        const categoryKey = row.categoryName.toLowerCase();
        let category = categoryCache.get(categoryKey);
        if (!category) {
          const found = await MenuCategory.findOrCreate({ where: { menuId: menu.id, name: row.categoryName }, defaults: { menuId: menu.id, name: row.categoryName, description: row.categoryDescription || null, sortOrder: row.categoryOrder, isActive: true }, transaction });
          category = found[0];
          if (found[1]) counts.categories += 1;
          else await category.update({ ...(row.categoryDescription && { description: row.categoryDescription }), sortOrder: row.categoryOrder }, { transaction });
          categoryCache.set(categoryKey, category);
        }

        const itemKey = `${category.id}:${row.itemName.toLowerCase()}`;
        let item = itemCache.get(itemKey);
        if (!item) {
          const found = await MenuItem.findOrCreate({ where: { categoryId: category.id, name: row.itemName }, defaults: { categoryId: category.id, name: row.itemName, description: row.itemDescription || null, priceMinor: row.priceMinor, sortOrder: row.itemOrder, isAvailable: row.itemAvailable }, transaction });
          item = found[0];
          if (found[1]) counts.items += 1;
          else await item.update({ priceMinor: row.priceMinor, ...(row.itemDescription && { description: row.itemDescription }), sortOrder: row.itemOrder, isAvailable: row.itemAvailable }, { transaction });
          itemCache.set(itemKey, item);
        }
        if (!row.optionGroupName || !row.optionName) continue;

        const groupKey = `${item.id}:${row.optionGroupName.toLowerCase()}`;
        let group = groupCache.get(groupKey);
        if (!group) {
          const found = await MenuItemOptionGroup.findOrCreate({ where: { menuItemId: item.id, name: row.optionGroupName }, defaults: { menuItemId: item.id, name: row.optionGroupName, selectionType: row.optionGroupType, minSelections: row.optionGroupMin, maxSelections: row.optionGroupType === "single" ? 1 : Math.max(1, row.optionGroupMax), sortOrder: row.optionOrder, isActive: true }, transaction });
          group = found[0];
          if (found[1]) counts.optionGroups += 1;
          else await group.update({ selectionType: row.optionGroupType, minSelections: row.optionGroupMin, maxSelections: row.optionGroupType === "single" ? 1 : Math.max(1, row.optionGroupMax) }, { transaction });
          groupCache.set(groupKey, group);
        }
        const foundOption = await MenuItemOption.findOrCreate({ where: { optionGroupId: group.id, name: row.optionName }, defaults: { optionGroupId: group.id, name: row.optionName, priceModifierMinor: row.optionPriceMinor, sortOrder: row.optionOrder, isAvailable: row.optionAvailable }, transaction });
        if (foundOption[1]) counts.options += 1;
        else await foundOption[0].update({ priceModifierMinor: row.optionPriceMinor, sortOrder: row.optionOrder, isAvailable: row.optionAvailable }, { transaction });
      }
      return { menuId: menu.id, ...counts };
    });
    return res.status(200).json({ success: true, message: "Menu importé en brouillon", data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error("Import restaurant menu CSV error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de l'import du menu CSV" });
  }
};
