"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };
    const uuidDefault = Sequelize.literal("gen_random_uuid()");
    const nowDefault = Sequelize.literal("CURRENT_TIMESTAMP");

    await queryInterface.addColumn("enterprises", "googleReviewUrl", {
      type: Sequelize.STRING(500),
      allowNull: true,
    }, options);

    await queryInterface.createTable("restaurant_reservations", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      enterpriseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "enterprises", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      reservationDate: { type: Sequelize.DATEONLY, allowNull: false },
      reservationTime: { type: Sequelize.STRING(5), allowNull: false },
      partySize: { type: Sequelize.INTEGER, allowNull: false },
      contact: { type: Sequelize.STRING(160), allowNull: false },
      status: { type: Sequelize.ENUM("pending", "confirmed", "cancelled"), allowNull: false, defaultValue: "pending" },
      source: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "table" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    }, options);

    await queryInterface.addIndex("restaurant_reservations", ["enterpriseId", "reservationDate", "reservationTime"], {
      name: "restaurant_reservations_schedule_idx",
      transaction,
    });
    await queryInterface.addIndex("restaurant_reservations", ["enterpriseId", "status"], {
      name: "restaurant_reservations_status_idx",
      transaction,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_reservations" ADD CONSTRAINT "restaurant_reservations_party_size_valid" CHECK ("partySize" BETWEEN 1 AND 100);',
      options
    );
  },

  async down(queryInterface, _Sequelize, transaction) {
    const options = { transaction };
    await queryInterface.dropTable("restaurant_reservations", options);
    await queryInterface.removeColumn("enterprises", "googleReviewUrl", options);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_reservations_status";', options);
  },
};
