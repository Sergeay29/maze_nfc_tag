require("dotenv").config();

const app = require("./app");

const syncDatabase = require("./config/sync");
const seedRoles = require("./seeds/role.seed");
const seedAdminUser = require("./seeds/admin.seed");
const seedDashboardData = require("./seeds/dashboard.seed");
const seedSettings = require("./seeds/settings.seed");
const seedEnterpriseUser = require("./seeds/enterprise.seed");

const PORT = process.env.PORT || 3000;

// Validation des variables d'environnement essentielles
function validateEnv() {
  const required = [
    "NODE_ENV",
    "JWT_SECRET",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
  ];

  // Vérifie Cloudinary seulement si on n'est pas en test (optionnel)
  if (process.env.NODE_ENV !== "test") {
    required.push("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET");
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(", ")}`);
  }

  // Vérifie que JWT_SECRET est suffisamment long en production
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET doit contenir au moins 32 caractères en production");
  }
}

async function start() {
  try {
    validateEnv();
    console.log("✅ Variables d'environnement validées");

    await syncDatabase();
    await seedRoles();
    await seedAdminUser();
    await seedDashboardData();
    await seedSettings();
    await seedEnterpriseUser();

    app.listen(PORT, () => {
      console.log(`🚀 Maze NFC API sur le port ${PORT}`);
      console.log(`📚 Documentation : http://localhost:${PORT}/api/docs`);
      console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Erreur de démarrage :", error.message);
    process.exit(1);
  }
}

start();
