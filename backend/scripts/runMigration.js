/**
 * Script pour exécuter les migrations de base de données
 * Usage: node scripts/runMigration.js <nom-du-fichier-migration>
 * Exemple: node scripts/runMigration.js add-service-token-and-card-service
 */

require("dotenv").config();
const sequelize = require("../config/database");
const Sequelize = require("sequelize");
const path = require("path");

async function runMigration() {
  try {
    // Récupérer le nom de la migration depuis les arguments
    const migrationName = process.argv[2];

    if (!migrationName) {
      console.error("❌ Erreur : Nom de la migration requis");
      console.log("Usage: node scripts/runMigration.js <nom-du-fichier-migration>");
      console.log("Exemple: node scripts/runMigration.js add-service-token-and-card-service");
      process.exit(1);
    }

    // Charger le fichier de migration
    const migrationPath = path.join(__dirname, "..", "migrations", `${migrationName}.js`);
    console.log(`📁 Chargement de la migration : ${migrationPath}`);

    const migration = require(migrationPath);

    if (!migration.up || typeof migration.up !== "function") {
      console.error("❌ Erreur : Le fichier de migration doit exporter une fonction 'up'");
      process.exit(1);
    }

    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données établie");

    // Créer le queryInterface
    const queryInterface = sequelize.getQueryInterface();

    console.log(`🚀 Exécution de la migration : ${migrationName}`);

    // Exécuter la migration
    await migration.up(queryInterface, Sequelize);

    console.log("✅ Migration exécutée avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution de la migration :", error);
    process.exit(1);
  }
}

runMigration();
