module.exports = {
  async up(queryInterface) {
    const [[column]] = await queryInterface.sequelize.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'nfc_cards' AND column_name = 'enterpriseId'
    `);

    if (column?.is_nullable === 'NO') {
      console.log('🔄 Correction : enterpriseId NOT NULL → nullable');
      await queryInterface.sequelize.query(
        'ALTER TABLE nfc_cards ALTER COLUMN "enterpriseId" DROP NOT NULL'
      );
      console.log('✅ enterpriseId corrigé');
    } else {
      console.log('ℹ️  enterpriseId déjà nullable — rien à faire');
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE nfc_cards
      SET "enterpriseId" = (SELECT id FROM enterprises ORDER BY "createdAt" ASC LIMIT 1)
      WHERE "enterpriseId" IS NULL
    `).catch(() => {});

    await queryInterface.sequelize.query(
      'ALTER TABLE nfc_cards ALTER COLUMN "enterpriseId" SET NOT NULL'
    );
  },
};
