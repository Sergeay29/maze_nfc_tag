const { CardType } = require("../models");

async function seedCardTypes() {
  const cardTypes = [
    {
      name: "Fidélité Entreprise",
      description: "Carte de fidélité pour les entreprises",
    },
    {
      name: "Restaurant",
      description: "Carte de fidélité pour les restaurants",
    },
    {
      name: "Carte de visite",
      description: "Carte de visite numérique NFC",
    },
  ];

  for (const cardType of cardTypes) {
    await CardType.findOrCreate({
      where: {
        name: cardType.name,
      },
      defaults: cardType,
    });
  }

  console.log("✅ Types de cartes initialisés");
}

module.exports = seedCardTypes;