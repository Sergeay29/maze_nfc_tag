const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

async function seedAdminUser() {
  const requiredVariables = [
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "ADMIN_FIRST_NAME",
    "ADMIN_LAST_NAME",
  ];

  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Variables administrateur manquantes : ${missingVariables.join(", ")}`
    );
  }

  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD doit contenir au moins 12 caractères"
    );
  }

  const role = await Role.findOne({
    where: {
      name: "SUPER_ADMIN",
    },
  });

  if (!role) {
    throw new Error(
      "Le rôle SUPER_ADMIN est introuvable. Exécutez d'abord le seed des rôles."
    );
  }

  const existingAdmin = await User.findOne({
    where: {
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    },
  });

  if (existingAdmin) {
    console.log("ℹ️ Administrateur initial déjà présent");
    return;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD,
    12
  );

  await User.create({
    firstName: process.env.ADMIN_FIRST_NAME.trim(),
    lastName: process.env.ADMIN_LAST_NAME.trim(),
    email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    password: hashedPassword,
    roleId: role.id,
    enterpriseId: null,
    isActive: true,
    mustChangePassword: true,
  });

  console.log("✅ Administrateur initial créé");
}

module.exports = seedAdminUser;