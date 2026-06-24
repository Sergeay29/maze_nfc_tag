require("dotenv").config();

const app = require("./app");

const syncDatabase = require("./config/sync");
const seedRoles = require("./seeds/role.seed");
const seedAdminUser = require("./seeds/admin.seed");
const seedDashboardData = require("./seeds/dashboard.seed");
const seedSettings = require("./seeds/settings.seed");

const PORT = process.env.PORT || 3000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET doit être défini dans le fichier .env");
  }

  await syncDatabase();
  await seedRoles();
  await seedAdminUser();
  await seedDashboardData();
  await seedSettings();

  app.listen(PORT, () => {
    console.log(`Maze NFC API sur le port ${PORT}`);
  });
}

start();
