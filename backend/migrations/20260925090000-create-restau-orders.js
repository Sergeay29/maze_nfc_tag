"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };
    const uuidDefault = Sequelize.literal("gen_random_uuid()");
    const nowDefault = Sequelize.literal("CURRENT_TIMESTAMP");

    await queryInterface.createTable("restaurant_orders", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      enterpriseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "enterprises", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      publicOrderToken: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      tableReference: { type: Sequelize.STRING(80), allowNull: true },
      contact: { type: Sequelize.STRING(160), allowNull: true },
      customerNote: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM("pending", "accepted", "preparing", "ready", "served", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      paymentStatus: { type: Sequelize.ENUM("unpaid", "paid", "failed"), allowNull: false, defaultValue: "unpaid" },
      totalMinor: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    }, options);

    await queryInterface.createTable("restaurant_order_items", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "restaurant_orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      menuItemId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "restaurant_menu_items", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      nameSnapshot: { type: Sequelize.STRING(150), allowNull: false },
      unitPriceMinor: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      lineTotalMinor: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    }, options);

    await queryInterface.addIndex("restaurant_orders", ["enterpriseId", "status", "createdAt"], {
      name: "restaurant_orders_enterprise_status_created_idx",
      transaction,
    });
    await queryInterface.addIndex("restaurant_order_items", ["orderId"], {
      name: "restaurant_order_items_order_idx",
      transaction,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_orders" ADD CONSTRAINT "restaurant_orders_total_valid" CHECK ("totalMinor" >= 0);',
      options
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_values_valid" CHECK ("quantity" BETWEEN 1 AND 20 AND "unitPriceMinor" >= 0 AND "lineTotalMinor" >= 0);',
      options
    );
  },

  async down(queryInterface, _Sequelize, transaction) {
    const options = { transaction };
    await queryInterface.dropTable("restaurant_order_items", options);
    await queryInterface.dropTable("restaurant_orders", options);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_order_items_status";', options);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_orders_status";', options);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_orders_paymentStatus";', options);
  },
};
