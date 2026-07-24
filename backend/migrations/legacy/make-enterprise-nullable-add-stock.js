/**
 * Migration : rendre enterpriseId nullable dans nfc_cards
 * Permet de créer des cartes "en stock global" (sans entreprise)
 * et d'ajouter la colonne stock_batch_id pour tracer les lots.
 *
 * Usage: node scripts/runMigration.js make-enterprise-nullable-add-stock
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Migration: enterpriseId nullable + colonne stockBatchId...');

    // 1. Rendre enterpriseId nullable
    await queryInterface.changeColumn('nfc_cards', 'enterpriseId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'enterprises', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('✅ enterpriseId rendu nullable');

    // 2. Ajouter la colonne stockBatchId (traçabilité des lots) — seulement si elle n'existe pas
    const [cols] = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'nfc_cards' AND column_name = 'stockBatchId'`
    );
    if (cols.length === 0) {
      await queryInterface.addColumn('nfc_cards', 'stockBatchId', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Identifiant du lot de génération (ex: BATCH-2026-001)',
      });
      console.log('✅ Colonne stockBatchId ajoutée');
    } else {
      console.log('ℹ️  Colonne stockBatchId déjà présente — ignorée');
    }

    console.log('🎉 Migration terminée avec succès !');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rollback...');

    await queryInterface.removeColumn('nfc_cards', 'stockBatchId');
    console.log('✅ Colonne stockBatchId supprimée');

    await queryInterface.changeColumn('nfc_cards', 'enterpriseId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'enterprises', key: 'id' },
    });
    console.log('✅ enterpriseId rendu NOT NULL');

    console.log('🎉 Rollback terminé !');
  },
};
