module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Migration audit_logs et champs 2FA...');

    // Supprimer l'ancienne table si elle existe (schéma legacy incompatible)
    await queryInterface.dropTable('audit_logs', { cascade: true }).catch(() => {});

    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      resourceType: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      resourceId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      oldValues: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      newValues: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('audit_logs', ['action'], { name: 'audit_logs_action_idx' });
    await queryInterface.addIndex('audit_logs', ['resourceType'], { name: 'audit_logs_resource_type_idx' });
    await queryInterface.addIndex('audit_logs', ['userId'], { name: 'audit_logs_user_id_idx' });
    await queryInterface.addIndex('audit_logs', ['createdAt'], { name: 'audit_logs_created_at_idx' });
    await queryInterface.addIndex('audit_logs', ['success'], { name: 'audit_logs_success_idx' });

    const usersTable = await queryInterface.describeTable('users');

    if (!usersTable.twoFactorEnabled) {
      await queryInterface.addColumn('users', 'twoFactorEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!usersTable.twoFactorSecret) {
      await queryInterface.addColumn('users', 'twoFactorSecret', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!usersTable.twoFactorBackupCodes) {
      await queryInterface.addColumn('users', 'twoFactorBackupCodes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    console.log('✅ Table audit_logs et champs 2FA créés');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.removeColumn('users', 'twoFactorBackupCodes').catch(() => {});
    await queryInterface.removeColumn('users', 'twoFactorSecret').catch(() => {});
    await queryInterface.removeColumn('users', 'twoFactorEnabled').catch(() => {});
    console.log('✅ Rollback audit_logs et 2FA effectué');
  },
};
