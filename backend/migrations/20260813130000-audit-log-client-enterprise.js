'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('audit_logs', 'clientId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('audit_logs', 'enterpriseId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'enterprises', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('audit_logs', ['clientId'], {
      name: 'audit_logs_client_id_idx',
    });

    await queryInterface.addIndex('audit_logs', ['enterpriseId'], {
      name: 'audit_logs_enterprise_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('audit_logs', 'audit_logs_enterprise_id_idx');
    await queryInterface.removeIndex('audit_logs', 'audit_logs_client_id_idx');
    await queryInterface.removeColumn('audit_logs', 'enterpriseId');
    await queryInterface.removeColumn('audit_logs', 'clientId');
  },
};
