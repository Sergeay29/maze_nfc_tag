const sequelize = require("./database");

async function syncDatabase() {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connecté");

    // alter: true met à jour les tables sans effacer les données existantes.
    // Passer à false une fois le schéma stabilisé pour éviter tout risque.
    await sequelize.sync({
      alter: true,
    });

    console.log("Tables synchronisées");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = syncDatabase;
