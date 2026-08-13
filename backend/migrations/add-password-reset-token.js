// migrations/add-password-reset-token.js
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Ajout des champs de réinitialisation de mot de passe...');

    await queryInterface.addColumn('users', 'resetPasswordToken', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'resetPasswordExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('users', ['resetPasswordToken'], {
      name: 'users_reset_token_idx',
    });

    console.log('✅ Champs resetPasswordToken et resetPasswordExpires ajoutés');
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_reset_token_idx');
    await queryInterface.removeColumn('users', 'resetPasswordToken');
    await queryInterface.removeColumn('users', 'resetPasswordExpires');
    console.log('✅ Rollback effectué');
  },
};
