/**
 * Migration pour ajouter le champ subtypes au modèle CardType
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Ajouter le champ subtypes à la table card_types
      await queryInterface.addColumn(
        "card_types",
        "subtypes",
        {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: [],
        },
        { transaction }
      );

      await transaction.commit();
      console.log("✅ Migration réussie : subtypes ajouté aux card_types");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Erreur lors de la migration :", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Supprimer la colonne subtypes de card_types
      await queryInterface.removeColumn("card_types", "subtypes", { transaction });

      await transaction.commit();
      console.log("✅ Rollback de la migration réussi");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Erreur lors du rollback :", error);
      throw error;
    }
  },
};
