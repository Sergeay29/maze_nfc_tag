// seeds/enterprise.seed.js
// Crée un compte utilisateur OWNER lié à la première entreprise seedée.

const bcrypt = require("bcryptjs");
const { User, Role, Enterprise } = require("../models");

async function seedEnterpriseUser() {
  const role = await Role.findOne({ where: { name: "OWNER" } });

  if (!role) {
    console.warn("Rôle OWNER introuvable, seed entreprise ignoré.");
    return;
  }

  // Vérifier si un OWNER existe déjà
  const existing = await User.findOne({ where: { roleId: role.id } });
  if (existing) {
    return;
  }

  // Récupérer la première entreprise (Conciergerie Premium)
  const enterprise = await Enterprise.findOne({
    where: { name: "Conciergerie Premium" },
  });

  if (!enterprise) {
    console.warn("Entreprise 'Conciergerie Premium' introuvable, seed ignoré.");
    return;
  }

  const password = "owner123456";
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie@conciergerie.fr",
    password: hashedPassword,
    roleId: role.id,
    isActive: true,
  });

  console.log("Compte entreprise (OWNER) initialisé — marie@conciergerie.fr / owner123456");
}

module.exports = seedEnterpriseUser;
