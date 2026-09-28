"use strict";

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };
    const uuidDefault = Sequelize.literal("gen_random_uuid()");
    const nowDefault = Sequelize.literal("CURRENT_TIMESTAMP");

    await queryInterface.createTable("restaurant_menu_item_option_groups", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      menuItemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "restaurant_menu_items", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      selectionType: { type: Sequelize.ENUM("single", "multiple"), allowNull: false, defaultValue: "single" },
      minSelections: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      maxSelections: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    }, options);

    await queryInterface.createTable("restaurant_menu_item_options", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: uuidDefault },
      optionGroupId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "restaurant_menu_item_option_groups", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      priceModifierMinor: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isAvailable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: nowDefault },
    }, options);

    await queryInterface.addColumn("restaurant_order_items", "selectedOptionsSnapshot", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: Sequelize.literal("'[]'::jsonb"),
    }, options);

    await queryInterface.addIndex("restaurant_menu_item_option_groups", ["menuItemId", "sortOrder"], {
      name: "restaurant_menu_item_option_groups_item_order_idx",
      transaction,
    });
    await queryInterface.addIndex("restaurant_menu_item_options", ["optionGroupId", "sortOrder"], {
      name: "restaurant_menu_item_options_group_order_idx",
      transaction,
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_menu_item_option_groups" ADD CONSTRAINT "restaurant_menu_item_option_groups_selection_valid" CHECK ("minSelections" >= 0 AND "maxSelections" >= "minSelections" AND "maxSelections" <= 20 AND ("selectionType" <> \'single\' OR "maxSelections" <= 1));',
      options,
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "restaurant_menu_item_options" ADD CONSTRAINT "restaurant_menu_item_options_price_valid" CHECK ("priceModifierMinor" >= 0);',
      options,
    );
  },

  async down(queryInterface, _Sequelize, transaction) {
    const options = { transaction };
    await queryInterface.removeColumn("restaurant_order_items", "selectedOptionsSnapshot", options);
    await queryInterface.dropTable("restaurant_menu_item_options", options);
    await queryInterface.dropTable("restaurant_menu_item_option_groups", options);
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_restaurant_menu_item_option_groups_selectionType";', options);
  },
};
