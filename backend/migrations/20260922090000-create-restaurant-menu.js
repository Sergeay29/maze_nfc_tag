"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };
    const uuidDefault = Sequelize.literal("gen_random_uuid()");
    const nowDefault = Sequelize.literal("CURRENT_TIMESTAMP");

    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    };

    await queryInterface.createTable("restaurant_menus", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      enterpriseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "enterprises", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(150), allowNull: false, defaultValue: "Menu principal" },
      status: { type: Sequelize.ENUM("draft", "published", "archived"), allowNull: false, defaultValue: "draft" },
      ...timestamps,
    }, options);

    await queryInterface.addIndex("restaurant_menus", ["enterpriseId"], {
      name: "restaurant_menus_enterprise_id_unique",
      unique: true,
      transaction,
    });

    await queryInterface.createTable("restaurant_menu_categories", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      menuId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "restaurant_menus", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps,
    }, options);

    await queryInterface.addIndex("restaurant_menu_categories", ["menuId", "sortOrder"], {
      name: "restaurant_menu_categories_order_idx",
      transaction,
    });

    await queryInterface.createTable("restaurant_menu_items", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "restaurant_menu_categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      priceMinor: { type: Sequelize.INTEGER, allowNull: false },
      imageUrl: { type: Sequelize.STRING(500), allowNull: true },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isAvailable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps,
    }, options);

    await queryInterface.addIndex("restaurant_menu_items", ["categoryId", "sortOrder"], {
      name: "restaurant_menu_items_order_idx",
      transaction,
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_menu_items" ADD CONSTRAINT "restaurant_menu_items_price_non_negative" CHECK ("priceMinor" >= 0);',
      options
    );
  },

  async down(queryInterface, _Sequelize, transaction) {
    const options = { transaction };
    await queryInterface.dropTable("restaurant_menu_items", options);
    await queryInterface.dropTable("restaurant_menu_categories", options);
    await queryInterface.dropTable("restaurant_menus", options);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_menus_status";', options);
  },
};
