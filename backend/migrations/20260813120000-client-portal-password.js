'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('clients', 'resetPasswordToken', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });

    await queryInterface.addColumn('clients', 'resetPasswordExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('clients', ['resetPasswordToken'], {
      name: 'clients_reset_password_token_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('clients', 'clients_reset_password_token_idx');
    await queryInterface.removeColumn('clients', 'resetPasswordExpires');
    await queryInterface.removeColumn('clients', 'resetPasswordToken');
    await queryInterface.removeColumn('clients', 'password');
  },
};
