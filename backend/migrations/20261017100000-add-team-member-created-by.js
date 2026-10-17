module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    const options = { transaction };
    await queryInterface.addColumn("users", "createdBy", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    }, options);
    await queryInterface.addIndex("users", ["createdBy"], {
      name: "users_created_by_idx",
      transaction,
    });
  },

  async down(queryInterface, _Sequelize, transaction) {
    await queryInterface.removeIndex("users", "users_created_by_idx", { transaction });
    await queryInterface.removeColumn("users", "createdBy", { transaction });
  },
};
