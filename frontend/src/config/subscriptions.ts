export type SubscriptionPlan = 'Starter' | 'Pro' | 'Enterprise';

export interface SubscriptionPlanConfig {
  label: string;
  monthlyPrice: number;
  currency: 'FCFA';
  cardsLimit: number;
  physicalCardsPerMonth: number;
  walletCardsPerMonth: number;
  dataAccess: string;
}

export const SUBSCRIPTION_PLAN_CONFIG: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  Starter: {
    label: 'Essentiel',
    monthlyPrice: 5000,
    currency: 'FCFA',
    cardsLimit: 1000,
    physicalCardsPerMonth: 2,
    walletCardsPerMonth: 20,
    dataAccess: 'Statistiques de base (nombre de passages, nombre de clients)',
  },
  Pro: {
    label: 'Standard',
    monthlyPrice: 10000,
    currency: 'FCFA',
    cardsLimit: 10000,
    physicalCardsPerMonth: 4,
    walletCardsPerMonth: 50,
    dataAccess: 'Historique détaillé + exports de données',
  },
  Enterprise: {
    label: 'Premium',
    monthlyPrice: 15000,
    currency: 'FCFA',
    cardsLimit: 50000,
    physicalCardsPerMonth: 7,
    walletCardsPerMonth: 100,
    dataAccess: 'Statistiques avancées en temps réel, recommandations et comparatifs',
  },
};

export const getSubscriptionPlanLabel = (plan?: string | null): string => {
  if (!plan || !(plan in SUBSCRIPTION_PLAN_CONFIG)) return plan ?? '—';
  return SUBSCRIPTION_PLAN_CONFIG[plan as SubscriptionPlan].label;
};

export const formatSubscriptionPrice = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0);
  return `${Number.isFinite(amount) ? amount.toLocaleString('fr-FR') : '0'} FCFA`;
};

export const SUBSCRIPTION_PLAN_OPTIONS = (
  Object.entries(SUBSCRIPTION_PLAN_CONFIG) as Array<[SubscriptionPlan, SubscriptionPlanConfig]>
).map(([value, config]) => ({
  value,
  label: `${config.label} — ${config.monthlyPrice.toLocaleString('fr-FR')} FCFA/mois`,
}));
