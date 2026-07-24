const { Sequelize } = require("sequelize");

const databasePort = Number.parseInt(
  process.env.DB_PORT || "5432",
  10
);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: databasePort,
    dialect: "postgres",

    /*
     * Les requêtes SQL ne sont pas affichées dans les logs
     * applicatifs par défaut.
     */
    logging:
      process.env.DB_LOGGING === "true"
        ? console.log
        : false,

    /*
     * Pool volontairement raisonnable pour un VPS de 2 vCPU.
     */
    pool: {
      max: 10,
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },

    /*
     * PostgreSQL se trouve dans le même réseau Docker.
     * La connexion interne n'utilise donc pas TLS.
     */
    dialectOptions: {
      ssl: false,
    },
  }
);

module.exports = sequelize;