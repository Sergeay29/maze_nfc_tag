// seeds/enterprise.seed.js
// Crée un compte OWNER lié à "Conciergerie Premium" si ce n'est pas déjà fait.

const bcrypt = require("bcryptjs");
const { User, Role, Enterprise } = require("../models");

async function seedEnterpriseUser() {
  const role = await Role.findOne({ where: { name: "OWNER" } });
  if (!role) {
    console.warn("Rôle OWNER introuvable, seed entreprise ignoré.");
    return;
  }

  const enterprise = await Enterprise.findOne({ where: { name: "Conciergerie Premium" } });
  if (!enterprise) {
    console.warn("Entreprise 'Conciergerie Premium' introuvable, seed ignoré.");
    return;
  }

  // Vérifier si un OWNER est déjà lié à cette entreprise
  const existing = await User.findOne({
    where: { roleId: role.id, enterpriseId: enterprise.id },
  });
  if (existing) return;

  const hashedPassword = await bcrypt.hash("owner123456", 10);

  await User.create({
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie@conciergerie.fr",
    password: hashedPassword,
    roleId: role.id,
    enterpriseId: enterprise.id,
    isActive: true,
  });

  console.log("✅ Compte entreprise (OWNER) initialisé — marie@conciergerie.fr / owner123456");
}

module.exports = seedEnterpriseUser;
