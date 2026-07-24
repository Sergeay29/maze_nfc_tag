require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

const DEFAULT_PORT = 3000;
const PORT = Number.parseInt(
  process.env.PORT || DEFAULT_PORT.toString(),
  10
);

let server = null;
let isShuttingDown = false;

function validateEnv() {
  const requiredVariables = [
    "NODE_ENV",
    "JWT_SECRET",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
  ];

  const missingVariables = requiredVariables.filter(
    (variableName) => !process.env[variableName]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes : ${missingVariables.join(", ")}`
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "JWT_SECRET doit contenir au moins 32 caractères en production"
    );
  }

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(
      `PORT invalide : ${process.env.PORT || DEFAULT_PORT}`
    );
  }

  const databasePort = Number.parseInt(
    process.env.DB_PORT,
    10
  );

  if (
    !Number.isInteger(databasePort) ||
    databasePort < 1 ||
    databasePort > 65535
  ) {
    throw new Error(
      `DB_PORT invalide : ${process.env.DB_PORT}`
    );
  }
}

async function startServer() {
  try {
    validateEnv();
    console.log("✅ Variables d'environnement validées");

    /*
     * Vérification de connexion uniquement.
     *
     * Aucune table n'est créée ou modifiée ici.
     * Les changements de schéma passent exclusivement
     * par les migrations contrôlées.
     */
    await sequelize.authenticate();
    console.log("✅ Connexion PostgreSQL établie");

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Maze NFC API démarrée sur le port ${PORT}`
      );

      console.log(
        "📚 Documentation disponible sur /api/docs"
      );

      console.log(
        `🌍 Environnement : ${process.env.NODE_ENV}`
      );
    });
  } catch (error) {
    console.error(
      "❌ Échec du démarrage :",
      error.message
    );

    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `\n🛑 Signal ${signal} reçu. Arrêt de l'application...`
  );

  /*
   * Le délai forcé empêche le conteneur de rester bloqué
   * indéfiniment pendant son arrêt.
   */
  const forceShutdownTimer = setTimeout(() => {
    console.error(
      "❌ Arrêt forcé après expiration du délai"
    );

    process.exit(1);
  }, 10_000);

  forceShutdownTimer.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      console.log("✅ Serveur HTTP arrêté");
    }

    await sequelize.close();
    console.log("✅ Connexion PostgreSQL fermée");

    clearTimeout(forceShutdownTimer);

    console.log("✅ Application arrêtée proprement");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Erreur pendant l'arrêt :",
      error.message
    );

    process.exit(1);
  }
}

process.once("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.once("SIGINT", () => {
  shutdown("SIGINT");
});

startServer();