"use strict";

const crypto = require("crypto");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("restaurant_tables", "publicToken", {
      type: Sequelize.STRING(48),
      allowNull: true,
    });

    const [tables] = await queryInterface.sequelize.query('SELECT "id" FROM "restaurant_tables"');
    for (const table of tables) {
      await queryInterface.sequelize.query(
        'UPDATE "restaurant_tables" SET "publicToken" = :token WHERE "id" = :id',
        { replacements: { id: table.id, token: crypto.randomBytes(24).toString("hex") } },
      );
    }

    await queryInterface.changeColumn("restaurant_tables", "publicToken", {
      type: Sequelize.STRING(48),
      allowNull: false,
    });
    await queryInterface.addIndex("restaurant_tables", ["publicToken"], {
      unique: true,
      name: "restaurant_tables_public_token_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("restaurant_tables", "restaurant_tables_public_token_unique");
    await queryInterface.removeColumn("restaurant_tables", "publicToken");
  },
};
