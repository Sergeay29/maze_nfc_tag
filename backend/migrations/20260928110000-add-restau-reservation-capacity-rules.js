"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };
    const nowDefault = Sequelize.literal("CURRENT_TIMESTAMP");

    await queryInterface.createTable("restaurant_reservation_settings", {
      enterpriseId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "enterprises", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      defaultDurationMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 90 },
      turnoverBufferMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 15 },
      allowPublicBookings: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    }, options);

    await queryInterface.addColumn("restaurant_tables", "zone", {
      type: Sequelize.STRING(80),
      allowNull: true,
    }, options);
    await queryInterface.addColumn("restaurant_reservations", "durationMinutes", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 90,
    }, options);
    await queryInterface.addColumn("restaurant_reservations", "turnoverBufferMinutes", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 15,
    }, options);
    await queryInterface.addIndex("restaurant_reservations", ["enterpriseId", "reservationDate", "status"], {
      name: "restaurant_reservations_enterprise_date_status_idx",
      transaction,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_reservation_settings" ADD CONSTRAINT "restaurant_reservation_settings_values_valid" CHECK ("defaultDurationMinutes" BETWEEN 15 AND 720 AND "turnoverBufferMinutes" BETWEEN 0 AND 180);',
      options,
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_reservations" ADD CONSTRAINT "restaurant_reservations_duration_values_valid" CHECK ("durationMinutes" BETWEEN 15 AND 720 AND "turnoverBufferMinutes" BETWEEN 0 AND 180);',
      options,
    );
  },

  async down(queryInterface, _Sequelize, transaction) {
    const options = { transaction };
    await queryInterface.removeIndex("restaurant_reservations", "restaurant_reservations_enterprise_date_status_idx", options);
    await queryInterface.removeColumn("restaurant_reservations", "turnoverBufferMinutes", options);
    await queryInterface.removeColumn("restaurant_reservations", "durationMinutes", options);
    await queryInterface.removeColumn("restaurant_tables", "zone", options);
    await queryInterface.dropTable("restaurant_reservation_settings", options);
  },
};
