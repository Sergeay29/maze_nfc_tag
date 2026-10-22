"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };

    const existing = await queryInterface.sequelize.query(
      'SELECT "name" FROM "roles" WHERE "name" IN (:names);',
      {
        replacements: {
          names: ["RESTAURANT_MANAGER", "RESTAURANT_STAFF"],
        },
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      },
    );

    const existingNames = new Set(existing.map((role) => role.name));

    const roles = [
      {
        name: "RESTAURANT_MANAGER",
        description: "Responsable du module Restaurant",
      },
      {
        name: "RESTAURANT_STAFF",
        description: "Équipe opérationnelle du restaurant",
      },
    ].filter((role) => !existingNames.has(role.name));

    if (roles.length) {
      await queryInterface.bulkInsert("roles", roles, options);
    }
  },

  async down(queryInterface, _Sequelize, transaction) {
    await queryInterface.bulkDelete(
      "roles",
      {
        name: ["RESTAURANT_MANAGER", "RESTAURANT_STAFF"],
      },
      { transaction },
    );
  },
};
