/**
 * Migration : rendre la colonne `type` nullable dans nfc_cards.
 * Les cartes en stock global n'ont pas de type — il est attribué lors de l'assignation à une entreprise.
 *
 * Usage: node scripts/runMigration.js make-card-type-nullable
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Migration: colonne type nullable dans nfc_cards...');

    await queryInterface.changeColumn('nfc_cards', 'type', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    console.log('✅ Colonne type rendue nullable');
    console.log('🎉 Migration terminée !');
  },

  async down(queryInterface, Sequelize) {
    // Remettre une valeur par défaut sur les nulls avant de rendre NOT NULL
    await queryInterface.sequelize.query(
      `UPDATE nfc_cards SET type = 'Inconnu' WHERE type IS NULL`
    );
    await queryInterface.changeColumn('nfc_cards', 'type', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
    console.log('✅ Rollback: type rendu NOT NULL');
  },
};
