'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('clients', 'clients_reset_password_token_idx').catch(() => {});
    await queryInterface.removeColumn('clients', 'resetPasswordExpires').catch(() => {});
    await queryInterface.removeColumn('clients', 'resetPasswordToken').catch(() => {});
    await queryInterface.removeColumn('clients', 'password').catch(() => {});
  },

  async down(queryInterface, Sequelize) {
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
};
