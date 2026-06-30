const sequelize = require("./database");

async function syncDatabase() {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connecté");

    const isDevelopment = process.env.NODE_ENV === "development";

    await sequelize.sync({
      force: isDevelopment, // Seulement en développement : recrée les tables (supprime les données)
      alter: !isDevelopment, // En production : met à jour les tables sans supprimer les données
    });

    console.log("Tables synchronisées");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = syncDatabase;
