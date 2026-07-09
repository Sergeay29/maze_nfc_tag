const { CardType } = require('../models');

async function seedCardTypes() {
  try {
    const count = await CardType.count();
    if (count > 0) {
      console.log('Card types already seeded. Skipping...');
      return;
    }
    await CardType.bulkCreate([
      { name: 'Fidélité Entreprise', description: 'Carte de fidélité pour les entreprises' },
      { name: 'Restaurant', description: 'Carte de fidélité pour les restaurants' },
      { name: 'Carte de visite', description: 'Carte de visite numérique NFC' },
    ]);
    console.log('✅ Card types seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding card types:', error);
    throw error;
  }
}

module.exports = seedCardTypes;
