/**
 * Gestionnaire de migrations PostgreSQL.
 *
 * Commandes :
 *   node scripts/runMigration.js up
 *   node scripts/runMigration.js status
 *   node scripts/runMigration.js down
 *
 * Par défaut :
 *   node scripts/runMigration.js
 *
 * équivaut à :
 *   node scripts/runMigration.js up
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

const sequelize = require("../config/database");

const MIGRATIONS_DIRECTORY = path.resolve(__dirname, "../migrations");
const MIGRATIONS_TABLE = "schema_migrations";

/**
 * Crée la table technique utilisée pour mémoriser
 * les migrations déjà exécutées.
 */
async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      "name" VARCHAR(255) PRIMARY KEY,
      "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Retourne les fichiers de migration dans un ordre déterministe.
 *
 * Les fichiers doivent idéalement commencer par un timestamp :
 * 20260723150000-initial-schema.js
 * 20260723151000-add-cardtype-subtypes.js
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIRECTORY)) {
    throw new Error(
      `Le répertoire des migrations est introuvable : ${MIGRATIONS_DIRECTORY}`
    );
  }

  return fs
    .readdirSync(MIGRATIONS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort((firstFile, secondFile) =>
      firstFile.localeCompare(secondFile, "en")
    );
}

/**
 * Retourne les migrations déjà enregistrées dans PostgreSQL.
 */
async function getExecutedMigrations() {
  const [rows] = await sequelize.query(`
    SELECT "name"
    FROM "${MIGRATIONS_TABLE}"
    ORDER BY "executed_at" ASC, "name" ASC
  `);

  return rows.map((row) => row.name);
}

/**
 * Vérifie la structure d'un fichier de migration.
 */
function loadMigration(fileName) {
  const migrationPath = path.join(MIGRATIONS_DIRECTORY, fileName);
  const migration = require(migrationPath);

  if (!migration || typeof migration.up !== "function") {
    throw new Error(
      `La migration "${fileName}" doit exporter une fonction up()`
    );
  }

  return migration;
}

/**
 * Exécute toutes les migrations qui n'ont pas encore été appliquées.
 */
async function migrateUp() {
  const queryInterface = sequelize.getQueryInterface();
  const migrationFiles = getMigrationFiles();
  const executedMigrations = new Set(await getExecutedMigrations());

  const pendingMigrations = migrationFiles.filter(
    (fileName) => !executedMigrations.has(fileName)
  );

  if (pendingMigrations.length === 0) {
    console.log("✅ Aucune migration en attente");
    return;
  }

  console.log(
    `📦 ${pendingMigrations.length} migration(s) en attente`
  );

  for (const fileName of pendingMigrations) {
    const migration = loadMigration(fileName);
    const transaction = await sequelize.transaction();

    try {
      console.log(`🚀 Exécution : ${fileName}`);

      /*
       * Le troisième paramètre permet aux migrations
       * d'utiliser explicitement cette transaction.
       */
      await migration.up(
        queryInterface,
        Sequelize,
        transaction
      );

      await sequelize.query(
        `
          INSERT INTO "${MIGRATIONS_TABLE}" ("name")
          VALUES (:migrationName)
        `,
        {
          replacements: {
            migrationName: fileName,
          },
          transaction,
        }
      );

      await transaction.commit();

      console.log(`✅ Migration terminée : ${fileName}`);
    } catch (error) {
      await transaction.rollback();

      throw new Error(
        `Échec de la migration "${fileName}" : ${error.message}`
      );
    }
  }

  console.log("✅ Toutes les migrations ont été appliquées");
}

/**
 * Annule la dernière migration exécutée.
 */
async function migrateDown() {
  const [rows] = await sequelize.query(`
    SELECT "name"
    FROM "${MIGRATIONS_TABLE}"
    ORDER BY "executed_at" DESC, "name" DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    console.log("✅ Aucune migration à annuler");
    return;
  }

  const fileName = rows[0].name;
  const migrationPath = path.join(MIGRATIONS_DIRECTORY, fileName);

  if (!fs.existsSync(migrationPath)) {
    throw new Error(
      `Le fichier correspondant à la migration "${fileName}" est introuvable`
    );
  }

  const migration = require(migrationPath);

  if (typeof migration.down !== "function") {
    throw new Error(
      `La migration "${fileName}" ne possède pas de fonction down()`
    );
  }

  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    console.log(`↩️ Annulation : ${fileName}`);

    await migration.down(
      queryInterface,
      Sequelize,
      transaction
    );

    await sequelize.query(
      `
        DELETE FROM "${MIGRATIONS_TABLE}"
        WHERE "name" = :migrationName
      `,
      {
        replacements: {
          migrationName: fileName,
        },
        transaction,
      }
    );

    await transaction.commit();

    console.log(`✅ Migration annulée : ${fileName}`);
  } catch (error) {
    await transaction.rollback();

    throw new Error(
      `Échec de l'annulation de "${fileName}" : ${error.message}`
    );
  }
}

/**
 * Affiche l'état de toutes les migrations.
 */
async function showStatus() {
  const migrationFiles = getMigrationFiles();
  const executedMigrations = new Set(await getExecutedMigrations());

  if (migrationFiles.length === 0) {
    console.log("Aucun fichier de migration trouvé");
    return;
  }

  console.log("État des migrations :\n");

  for (const fileName of migrationFiles) {
    const status = executedMigrations.has(fileName)
      ? "exécutée"
      : "en attente";

    console.log(
      `${executedMigrations.has(fileName) ? "✅" : "⏳"} ${fileName} — ${status}`
    );
  }
}

async function main() {
  const command = process.argv[2] || "up";

  try {
    await sequelize.authenticate();
    console.log("✅ Connexion PostgreSQL établie");

    await ensureMigrationsTable();

    switch (command) {
      case "up":
        await migrateUp();
        break;

      case "down":
        await migrateDown();
        break;

      case "status":
        await showStatus();
        break;

      default:
        throw new Error(
          `Commande inconnue : ${command}. Commandes disponibles : up, down, status`
        );
    }
  } catch (error) {
    console.error("❌ Erreur de migration :", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
    console.log("🔌 Connexion PostgreSQL fermée");
  }
}

main();