"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("restaurant_orders", "tableId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "restaurant_tables", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("restaurant_orders", ["tableId"], {
      name: "restaurant_orders_table_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("restaurant_orders", "restaurant_orders_table_id_idx");
    await queryInterface.removeColumn("restaurant_orders", "tableId");
  },
};
