const sequelize = require("./database");

async function syncDatabase() {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connecté");

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
