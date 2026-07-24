require("dotenv").config();

const sequelize = require("../config/database");

const seedRoles = require("../seeds/role.seed");
const seedCardTypes = require("../seeds/cardType.seed");
const seedSettings = require("../seeds/settings.seed");
const seedAdminUser = require("../seeds/admin.seed");

async function seedProduction() {
    try {
        await sequelize.authenticate();

        console.log("✅ Connexion PostgreSQL établie");
        console.log("🌱 Initialisation des données de production...");

        await seedRoles();
        await seedCardTypes();
        await seedSettings();
        await seedAdminUser();

        console.log("✅ Initialisation production terminée");
    } catch (error) {
        console.error(
            "❌ Échec de l'initialisation :",
            error.message
        );

        process.exitCode = 1;
    } finally {
        await sequelize.close();
        console.log("🔌 Connexion PostgreSQL fermée");
    }
}

seedProduction();