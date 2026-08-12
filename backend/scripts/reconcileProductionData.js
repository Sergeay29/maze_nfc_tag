const sequelize = require("../config/database");
const {
  Enterprise,
  NFCCard,
  Setting,
  Subscription,
} = require("../models");
const {
  getSubscriptionPlanConfig,
} = require("../utils/subscriptionPlans");
const {
  generateCardScanUrl,
} = require("../utils/urlGenerator");

const isDryRun = process.argv.includes("--dry-run");

async function reconcileSubscriptions(transaction) {
  const subscriptions = await Subscription.findAll({ transaction });
  let updated = 0;

  for (const subscription of subscriptions) {
    const config = getSubscriptionPlanConfig(subscription.plan);

    const subscriptionNeedsUpdate =
      Number(subscription.monthlyPrice) !== config.monthlyPrice ||
      subscription.cardsLimit !== config.cardsLimit;

    if (subscriptionNeedsUpdate) {
      await subscription.update(
        {
          monthlyPrice: config.monthlyPrice,
          cardsLimit: config.cardsLimit,
        },
        { transaction },
      );
      updated += 1;
    }

    const enterprise = await Enterprise.findByPk(
      subscription.enterpriseId,
      { transaction },
    );

    if (
      enterprise &&
      enterprise.subscription !== subscription.plan
    ) {
      await enterprise.update(
        { subscription: subscription.plan },
        { transaction },
      );
      updated += 1;
    }
  }

  return updated;
}

async function reconcileCardUrls(transaction) {
  const baseUrl =
    process.env.SCAN_BASE_URL || process.env.PUBLIC_APP_URL;

  if (!baseUrl) {
    throw new Error(
      "SCAN_BASE_URL ou PUBLIC_APP_URL doit être configuré",
    );
  }

  const enterprises = await Enterprise.findAll({
    transaction,
    attributes: ["id", "name"],
  });

  const enterpriseNames = new Map(
    enterprises.map((enterprise) => [
      enterprise.id,
      enterprise.name,
    ]),
  );

  const cards = await NFCCard.findAll({
    where: {
      enterpriseId: {
        [require("sequelize").Op.ne]: null,
      },
    },
    transaction,
  });

  let updated = 0;
  let skipped = 0;

  for (const card of cards) {
    const enterpriseName = enterpriseNames.get(card.enterpriseId);

    if (!enterpriseName || !card.type || !card.scanToken) {
      skipped += 1;
      continue;
    }

    const expectedUrl = generateCardScanUrl({
      enterpriseName,
      cardType: card.type,
      scanToken: card.scanToken,
      baseUrl,
    });

    if (card.scanUrl !== expectedUrl) {
      await card.update(
        { scanUrl: expectedUrl },
        { transaction },
      );
      updated += 1;
    }
  }

  return {
    baseUrl,
    updated,
    skipped,
  };
}

async function reconcileSettings(transaction, baseUrl) {
  const apiUrl =
    process.env.API_PUBLIC_URL ||
    `${baseUrl.replace(/\/$/, "")}/api`;

  await Setting.upsert(
    {
      key: "nfc_base_url",
      value: baseUrl,
      label: "URL de base des cartes NFC",
      group: "general",
    },
    { transaction },
  );

  await Setting.upsert(
    {
      key: "api_url",
      value: apiUrl,
      label: "URL de l'API",
      group: "general",
    },
    { transaction },
  );

  return apiUrl;
}

async function main() {
  await sequelize.authenticate();

  const transaction = await sequelize.transaction();

  try {
    const subscriptionChanges =
      await reconcileSubscriptions(transaction);

    const cardResult =
      await reconcileCardUrls(transaction);

    const apiUrl = await reconcileSettings(
      transaction,
      cardResult.baseUrl,
    );

    if (isDryRun) {
      await transaction.rollback();
    } else {
      await transaction.commit();
    }

    console.log(
      isDryRun
        ? "DRY RUN terminé — aucune modification enregistrée."
        : "Réconciliation terminée avec succès.",
    );
    console.log(
      `Abonnements synchronisés : ${subscriptionChanges}`,
    );
    console.log(
      `URLs de cartes mises à jour : ${cardResult.updated}`,
    );
    console.log(
      `Cartes ignorées faute de données : ${cardResult.skipped}`,
    );
    console.log(`URL NFC : ${cardResult.baseUrl}`);
    console.log(`URL API : ${apiUrl}`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error("Erreur de réconciliation :", error);
  process.exitCode = 1;
});
