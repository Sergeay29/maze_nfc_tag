const {
  Enterprise,
  Menu,
  MenuCategory,
  MenuItem,
} = require("../models");

function getEnterpriseId(req) {
  return req.user?.enterpriseId || null;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function findOwnedMenu(menuId, enterpriseId) {
  return Menu.findOne({ where: { id: menuId, enterpriseId } });
}

async function findOwnedCategory(categoryId, enterpriseId) {
  const category = await MenuCategory.findByPk(categoryId);
  if (!category) return null;

  const menu = await findOwnedMenu(category.menuId, enterpriseId);
  return menu ? { category, menu } : null;
}

async function findOwnedItem(itemId, enterpriseId) {
  const item = await MenuItem.findByPk(itemId);
  if (!item) return null;

  return findOwnedCategory(item.categoryId, enterpriseId).then((owner) =>
    owner ? { item, ...owner } : null
  );
}

function menuIncludes({ publicOnly = false } = {}) {
  return [
    {
      model: MenuCategory,
      as: "categories",
      where: publicOnly ? { isActive: true } : undefined,
      required: false,
      include: [
        {
          model: MenuItem,
          as: "items",
          where: publicOnly ? { isAvailable: true } : undefined,
          required: false,
        },
      ],
    },
  ];
}

const menuOrder = [
  [{ model: MenuCategory, as: "categories" }, "sortOrder", "ASC"],
  [{ model: MenuCategory, as: "categories" }, { model: MenuItem, as: "items" }, "sortOrder", "ASC"],
];

exports.getMenu = async (req, res) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    if (!enterpriseId) {
      return res.status(404).json({
        success: false,
        message: "Aucune entreprise associée à votre compte",
      });
    }

    const menu = await Menu.findOne({
      where: { enterpriseId },
      include: menuIncludes(),
      order: menuOrder,
    });

    return res.json({ success: true, data: menu });
  } catch (error) {
    console.error("Get restaurant menu error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du menu",
    });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const name = normalizeText(req.body.name) || "Menu principal";

    if (!enterpriseId) {
      return res.status(404).json({ success: false, message: "Entreprise introuvable" });
    }

    const existingMenu = await Menu.findOne({ where: { enterpriseId } });
    if (existingMenu) {
      return res.status(409).json({
        success: false,
        message: "Un menu existe déjà pour ce restaurant",
      });
    }

    const menu = await Menu.create({ enterpriseId, name, status: "draft" });
    return res.status(201).json({ success: true, data: menu });
  } catch (error) {
    console.error("Create restaurant menu error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la création du menu" });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const enterpriseId = getEnterpriseId(req);
    const menu = await findOwnedMenu(req.params.id, enterpriseId);
    if (!menu) return res.status(404).json({ success: false, message: "Menu introuvable" });

    const name = req.body.name === undefined ? menu.name : normalizeText(req.body.name);
    const status = req.body.status === undefined ? menu.status : req.body.status;
    if (!name || !["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({ success: false, message: "Nom ou statut de menu invalide" });
    }

    await menu.update({ name, status });
    return res.json({ success: true, data: menu });
  } catch (error) {
    console.error("Update restaurant menu error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du menu" });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const menu = await findOwnedMenu(req.params.id, getEnterpriseId(req));
    if (!menu) return res.status(404).json({ success: false, message: "Menu introuvable" });

    await menu.destroy();
    return res.json({ success: true, message: "Menu supprimé avec succès" });
  } catch (error) {
    console.error("Delete restaurant menu error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la suppression du menu" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const menu = await findOwnedMenu(req.params.menuId, getEnterpriseId(req));
    const name = normalizeText(req.body.name);
    if (!menu) return res.status(404).json({ success: false, message: "Menu introuvable" });
    if (!name) return res.status(400).json({ success: false, message: "Le nom de la catégorie est obligatoire" });

    const category = await MenuCategory.create({
      menuId: menu.id,
      name,
      description: normalizeText(req.body.description) || null,
      sortOrder: parseNonNegativeInteger(req.body.sortOrder) ?? 0,
      isActive: req.body.isActive !== false,
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("Create menu category error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la création de la catégorie" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const owner = await findOwnedCategory(req.params.id, getEnterpriseId(req));
    if (!owner) return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    const name = req.body.name === undefined ? owner.category.name : normalizeText(req.body.name);
    if (!name) return res.status(400).json({ success: false, message: "Le nom de la catégorie est obligatoire" });

    await owner.category.update({
      name,
      ...(req.body.description !== undefined && { description: normalizeText(req.body.description) || null }),
      ...(req.body.sortOrder !== undefined && { sortOrder: parseNonNegativeInteger(req.body.sortOrder) ?? 0 }),
      ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
    });

    return res.json({ success: true, data: owner.category });
  } catch (error) {
    console.error("Update menu category error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour de la catégorie" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const owner = await findOwnedCategory(req.params.id, getEnterpriseId(req));
    if (!owner) return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    await owner.category.destroy();
    return res.json({ success: true, message: "Catégorie supprimée avec succès" });
  } catch (error) {
    console.error("Delete menu category error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la suppression de la catégorie" });
  }
};

exports.createItem = async (req, res) => {
  try {
    const owner = await findOwnedCategory(req.params.categoryId, getEnterpriseId(req));
    const name = normalizeText(req.body.name);
    const priceMinor = parseNonNegativeInteger(req.body.priceMinor);

    if (!owner) return res.status(404).json({ success: false, message: "Catégorie introuvable" });
    if (!name || priceMinor === null) {
      return res.status(400).json({ success: false, message: "Nom et prix valide sont obligatoires" });
    }

    const item = await MenuItem.create({
      categoryId: owner.category.id,
      name,
      description: normalizeText(req.body.description) || null,
      priceMinor,
      imageUrl: normalizeText(req.body.imageUrl) || null,
      sortOrder: parseNonNegativeInteger(req.body.sortOrder) ?? 0,
      isAvailable: req.body.isAvailable !== false,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("Create menu item error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la création du plat" });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const owner = await findOwnedItem(req.params.id, getEnterpriseId(req));
    if (!owner) return res.status(404).json({ success: false, message: "Plat introuvable" });

    const name = req.body.name === undefined ? owner.item.name : normalizeText(req.body.name);
    if (!name) return res.status(400).json({ success: false, message: "Le nom du plat est obligatoire" });

    await owner.item.update({
      name,
      ...(req.body.description !== undefined && { description: normalizeText(req.body.description) || null }),
      ...(req.body.priceMinor !== undefined && { priceMinor: parseNonNegativeInteger(req.body.priceMinor) ?? 0 }),
      ...(req.body.imageUrl !== undefined && { imageUrl: normalizeText(req.body.imageUrl) || null }),
      ...(req.body.sortOrder !== undefined && { sortOrder: parseNonNegativeInteger(req.body.sortOrder) ?? 0 }),
      ...(req.body.isAvailable !== undefined && { isAvailable: req.body.isAvailable }),
    });

    return res.json({ success: true, data: owner.item });
  } catch (error) {
    console.error("Update menu item error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du plat" });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const owner = await findOwnedItem(req.params.id, getEnterpriseId(req));
    if (!owner) return res.status(404).json({ success: false, message: "Plat introuvable" });

    await owner.item.destroy();
    return res.json({ success: true, message: "Plat supprimé avec succès" });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la suppression du plat" });
  }
};

exports.getPublicMenu = async (req, res) => {
  try {
    const enterprise = await Enterprise.findOne({
      where: { id: req.params.enterpriseId, status: "active" },
      attributes: ["id", "name", "logo", "location"],
    });

    if (!enterprise) {
      return res.status(404).json({ success: false, message: "Restaurant introuvable" });
    }

    const menu = await Menu.findOne({
      where: { enterpriseId: enterprise.id, status: "published" },
      include: menuIncludes({ publicOnly: true }),
      order: menuOrder,
    });

    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu publié introuvable" });
    }

    return res.json({
      success: true,
      data: {
        restaurant: enterprise,
        menu,
      },
    });
  } catch (error) {
    console.error("Get public restaurant menu error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération du menu public" });
  }
};
