"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.addColumn(
      "restaurant_orders",
      "tableId",
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "restaurant_tables", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      { transaction },
    );

    await queryInterface.addIndex("restaurant_orders", ["tableId"], {
      name: "restaurant_orders_table_id_idx",
      transaction,
    });
  },

  async down(queryInterface, _Sequelize, transaction) {
    await queryInterface.removeIndex(
      "restaurant_orders",
      "restaurant_orders_table_id_idx",
      { transaction },
    );

    await queryInterface.removeColumn(
      "restaurant_orders",
      "tableId",
      { transaction },
    );
  },
};
