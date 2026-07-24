// migrations/add-scan-token-to-cards.js
// Migration pour ajouter le champ scanToken aux cartes NFC existantes

const crypto = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Migration: Ajout du champ scanToken aux cartes NFC...');

    // 1. Ajouter la colonne scanToken (nullable temporairement)
    await queryInterface.addColumn('nfc_cards', 'scanToken', {
      type: Sequelize.STRING(32),
      allowNull: true,
      comment: 'Token unique pour l\'URL de scan (généré automatiquement)',
    });

    console.log('✅ Colonne scanToken ajoutée');

    // 2. Générer des scanToken pour toutes les cartes existantes
    const [cards] = await queryInterface.sequelize.query(
      'SELECT id FROM nfc_cards WHERE "scanToken" IS NULL'
    );

    console.log(`📝 Génération de tokens pour ${cards.length} cartes...`);

    for (const card of cards) {
      const scanToken = crypto.randomBytes(16).toString('hex');
      await queryInterface.sequelize.query(
        'UPDATE nfc_cards SET "scanToken" = :scanToken WHERE id = :id',
        {
          replacements: { scanToken, id: card.id },
        }
      );
    }

    console.log('✅ Tous les tokens ont été générés');

    // 3. Rendre la colonne NOT NULL et unique
    await queryInterface.changeColumn('nfc_cards', 'scanToken', {
      type: Sequelize.STRING(32),
      allowNull: false,
      unique: true,
      comment: 'Token unique pour l\'URL de scan (généré automatiquement)',
    });

    console.log('✅ Contraintes ajoutées (NOT NULL, UNIQUE)');

    // 4. Ajouter un index unique
    await queryInterface.addIndex('nfc_cards', ['scanToken'], {
      unique: true,
      name: 'nfc_cards_scanToken_unique',
    });

    console.log('✅ Index unique ajouté');

    console.log('🎉 Migration terminée avec succès !');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rollback: Suppression du champ scanToken...');

    // Supprimer l'index
    await queryInterface.removeIndex('nfc_cards', 'nfc_cards_scanToken_unique');
    console.log('✅ Index supprimé');

    // Supprimer la colonne
    await queryInterface.removeColumn('nfc_cards', 'scanToken');
    console.log('✅ Colonne scanToken supprimée');

    console.log('🎉 Rollback terminé avec succès !');
  },
};
