"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("restaurant_tables", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      enterpriseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "enterprises", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      label: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn("restaurant_reservations", "tableId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "restaurant_tables", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("restaurant_tables", ["enterpriseId", "status"], {
      name: "restaurant_tables_enterprise_status_idx",
    });
    await queryInterface.addIndex("restaurant_reservations", ["enterpriseId", "reservationDate", "reservationTime", "status"], {
      name: "restaurant_reservations_availability_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("restaurant_reservations", "tableId");
    await queryInterface.removeIndex("restaurant_reservations", "restaurant_reservations_availability_idx");
    await queryInterface.removeIndex("restaurant_tables", "restaurant_tables_enterprise_status_idx");
    await queryInterface.dropTable("restaurant_tables");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_tables_status";');
  },
};
