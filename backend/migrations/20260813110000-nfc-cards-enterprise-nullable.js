module.exports = {
  async up(queryInterface) {
    console.log('🔄 Rendre enterpriseId nullable sur nfc_cards pour le stock global...');

    await queryInterface.sequelize.query(
      'ALTER TABLE nfc_cards ALTER COLUMN "enterpriseId" DROP NOT NULL'
    );

    console.log('✅ enterpriseId est nullable — le stock global Maze est supporté');
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

    console.log('✅ Rollback enterpriseId NOT NULL effectué');
  },
};
