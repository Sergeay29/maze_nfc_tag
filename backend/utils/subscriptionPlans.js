const SUBSCRIPTION_PLANS = Object.freeze({
  Starter: Object.freeze({
    label: "Essentiel",
    monthlyPrice: 5000,
    cardsLimit: 1000,
    physicalCardsPerMonth: 2,
    walletCardsPerMonth: 20,
    dataAccess: "Statistiques de base (nombre de passages, nombre de clients)",
  }),
  Pro: Object.freeze({
    label: "Standard",
    monthlyPrice: 10000,
    cardsLimit: 10000,
    physicalCardsPerMonth: 4,
    walletCardsPerMonth: 50,
    dataAccess: "Historique détaillé + exports de données",
  }),
  Enterprise: Object.freeze({
    label: "Premium",
    monthlyPrice: 15000,
    cardsLimit: 50000,
    physicalCardsPerMonth: 7,
    walletCardsPerMonth: 100,
    dataAccess: "Statistiques avancées en temps réel, recommandations et comparatifs",
  }),
});

const isValidSubscriptionPlan = (plan) =>
  Object.prototype.hasOwnProperty.call(SUBSCRIPTION_PLANS, plan);

const getSubscriptionPlanConfig = (plan) => {
  if (!isValidSubscriptionPlan(plan)) {
    throw new Error(`Plan d'abonnement invalide: ${plan}`);
  }

  return SUBSCRIPTION_PLANS[plan];
};

module.exports = {
  SUBSCRIPTION_PLANS,
  isValidSubscriptionPlan,
  getSubscriptionPlanConfig,
};
