const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

async function seedAdminUser() {
  const role = await Role.findOne({
    where: {
      name: "SUPER_ADMIN",
    },
  });

  if (!role) {
    throw new Error("Le rôle SUPER_ADMIN est introuvable");
  }

  const existingAdmin = await User.findOne({
    where: {
      roleId: role.id,
    },
  });

  if (existingAdmin) {
    return;
  }

  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    firstName: process.env.ADMIN_FIRST_NAME || "Admin",
    lastName: process.env.ADMIN_LAST_NAME || "Principal",
    email: process.env.ADMIN_EMAIL || "admin@maze-nfc.local",
    password: hashedPassword,
    roleId: role.id,
  });

  console.log("Admin initialisé");
}

module.exports = seedAdminUser;
