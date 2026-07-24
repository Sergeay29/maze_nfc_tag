/**
 * Migration pour ajouter:
 * - scanToken au modèle Service
 * - serviceId au modèle NFCCard
 * 
 * Cette migration permet la génération dynamique des URLs de scan
 * au format: nomdedomaine.com/typedecarte/entreprise-type/token
 */

const crypto = require("crypto");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Ajouter le champ scanToken à la table services
      await queryInterface.addColumn(
        "services",
        "scanToken",
        {
          type: Sequelize.STRING(32),
          allowNull: true, // Temporairement nullable pour la migration
          unique: true,
        },
        { transaction }
      );

      // 2. Générer des tokens pour les services existants
      const services = await queryInterface.sequelize.query(
        'SELECT id FROM services WHERE "scanToken" IS NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      for (const service of services) {
        const token = crypto.randomBytes(16).toString("hex");
        await queryInterface.sequelize.query(
          'UPDATE services SET "scanToken" = :token WHERE id = :id',
          {
            replacements: { token, id: service.id },
            transaction,
          }
        );
      }

      // 3. Rendre scanToken NOT NULL après avoir rempli les valeurs
      await queryInterface.changeColumn(
        "services",
        "scanToken",
        {
          type: Sequelize.STRING(32),
          allowNull: false,
          unique: true,
        },
        { transaction }
      );

      // 4. Ajouter le champ serviceId à la table nfc_cards
      await queryInterface.addColumn(
        "nfc_cards",
        "serviceId",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "services",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction }
      );

      // 5. Ajouter un index sur serviceId pour améliorer les performances
      await queryInterface.addIndex("nfc_cards", ["serviceId"], {
        name: "nfc_cards_serviceId_idx",
        transaction,
      });

      await transaction.commit();
      console.log("✅ Migration réussie : scanToken ajouté aux services, serviceId ajouté aux cartes NFC");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Erreur lors de la migration :", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Supprimer l'index
      await queryInterface.removeIndex("nfc_cards", "nfc_cards_serviceId_idx", { transaction });

      // Supprimer la colonne serviceId de nfc_cards
      await queryInterface.removeColumn("nfc_cards", "serviceId", { transaction });

      // Supprimer la colonne scanToken de services
      await queryInterface.removeColumn("services", "scanToken", { transaction });

      await transaction.commit();
      console.log("✅ Rollback de la migration réussi");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Erreur lors du rollback :", error);
      throw error;
    }
  },
};
