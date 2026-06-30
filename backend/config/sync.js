const { Sequelize } = require("sequelize");
const sequelize = require("./database");

async function createDatabaseIfNotExists() {
  const dbName = process.env.DB_NAME;
  
  // Connexion au serveur PostgreSQL sans base de données spécifique
  const tempSequelize = new Sequelize(
    "postgres", // Base de données par défaut
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: false,
    }
  );

  try {
    await tempSequelize.authenticate();
    console.log("Connexion au serveur PostgreSQL établie");

    // Vérification si la base de données existe
    const [results] = await tempSequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (results.length === 0) {
      console.log(`Création de la base de données "${dbName}"...`);
      await tempSequelize.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Base de données "${dbName}" créée avec succès`);
    } else {
      console.log(`Base de données "${dbName}" existe déjà`);
    }
  } finally {
    await tempSequelize.close();
  }
}

async function syncDatabase() {
  try {
    await createDatabaseIfNotExists();
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
