import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { Badge, Table, SearchInput, Card, StatCard, Select } from '../../components';
import { getSubscriptions, updateSubscription } from '../../api/adminApi';
import type { SubscriptionRecord } from '../../api/adminApi';

const PLAN_OPTIONS = [
  { value: 'all', label: 'Tous les plans' },
  { value: 'Starter', label: 'Starter' },
  { value: 'Pro', label: 'Pro' },
  { value: 'Enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'paused', label: 'Pausé' },
  { value: 'cancelled', label: 'Annulé' },
];

const PLAN_PRICES: Record<string, number> = {
  Starter: 29,
  Pro: 99,
  Enterprise: 299,
};

const SubscriptionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [countByPlan, setCountByPlan] = useState<Array<{ plan: string; count: string }>>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 10;

  // Filtre search côté client (backend n'a pas de search sur subscriptions)
  const filteredSubs = search.trim()
    ? subscriptions.filter((s) =>
        s.Enterprise?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.Enterprise?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : subscriptions;

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSubscriptions({
        page,
        limit,
        plan: planFilter,
        status: statusFilter,
      });
      setSubscriptions(result.data);
      setTotal(result.total);
      setTotalRevenue(result.stats?.totalRevenue ?? 0);
      setCountByPlan(result.stats?.countByPlan ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, planFilter, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleChangePlan = async (subscriptionId: string, newPlan: string) => {
    if (!window.confirm(`Changer le plan vers ${newPlan} ?`)) return;
    try {
      setUpdatingId(subscriptionId);
      await updateSubscription(subscriptionId, { plan: newPlan });
      await fetchSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (sub: SubscriptionRecord) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    if (!window.confirm(`${newStatus === 'paused' ? 'Pausser' : 'Réactiver'} cet abonnement ?`)) return;
    try {
      setUpdatingId(sub.id);
      await updateSubscription(sub.id, { status: newStatus });
      await fetchSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats rapides pour les cartes
  const starterCount = countByPlan.find((c) => c.plan === 'Starter')?.count ?? '0';
  const proCount = countByPlan.find((c) => c.plan === 'Pro')?.count ?? '0';
  const enterpriseCount = countByPlan.find((c) => c.plan === 'Enterprise')?.count ?? '0';

  const columns = [
    {
      key: 'enterprise',
      header: 'Entreprise',
      render: (sub: SubscriptionRecord) => (
        <div className="flex items-center gap-3">
          {sub.Enterprise?.logo ? (
            <img
              src={sub.Enterprise.logo}
              alt={sub.Enterprise.name}
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {sub.Enterprise?.name?.charAt(0) ?? '?'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-dark">{sub.Enterprise?.name ?? '—'}</p>
            <p className="text-xs text-slate">{sub.Enterprise?.email ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (sub: SubscriptionRecord) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              sub.plan === 'Enterprise' ? 'platinum' : sub.plan === 'Pro' ? 'gold' : 'silver'
            }
          >
            {sub.plan}
          </Badge>
          <select
            value={sub.plan}
            onChange={(e) => handleChangePlan(sub.id, e.target.value)}
            disabled={updatingId === sub.id}
            className="text-xs px-2 py-1 bg-cloud border border-slate/20 rounded-lg text-dark focus:outline-none focus:border-primary disabled:opacity-50"
            onClick={(e) => e.stopPropagation()}
          >
            {['Starter', 'Pro', 'Enterprise'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Prix',
      render: (sub: SubscriptionRecord) => (
        <span className="font-medium text-dark">
          {Number(sub.monthlyPrice).toLocaleString('fr-FR')}€
          <span className="text-xs text-slate">/mois</span>
        </span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'status',
      header: 'Statut',
      render: (sub: SubscriptionRecord) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              sub.status === 'active' ? 'active' : sub.status === 'paused' ? 'warning' : 'inactive'
            }
          >
            {sub.status === 'active' ? 'Actif' : sub.status === 'paused' ? 'Pausé' : 'Annulé'}
          </Badge>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(sub); }}
            disabled={updatingId === sub.id || sub.status === 'cancelled'}
            className="p-1 rounded-lg hover:bg-cloud transition-colors disabled:opacity-40"
            title={sub.status === 'active' ? 'Pausser' : 'Réactiver'}
          >
            <RefreshCw className={`w-4 h-4 text-slate ${updatingId === sub.id ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Depuis',
      render: (sub: SubscriptionRecord) => (
        <span className="text-slate text-sm">
          {new Date(sub.startDate).toLocaleDateString('fr-FR')}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Abonnements</h1>
        <p className="text-slate mt-1">Gérez les abonnements des entreprises</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenus mensuels"
          value={`€${Number(totalRevenue).toLocaleString('fr-FR')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          gradient
        />
        <StatCard
          title="Plan Starter"
          value={starterCount}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Plan Pro"
          value={proCount}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Plan Enterprise"
          value={enterpriseCount}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Grille tarifaire */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['Starter', 'Pro', 'Enterprise'] as const).map((plan) => (
          <Card key={plan} className={plan === 'Enterprise' ? 'ring-2 ring-primary' : ''}>
            <div className="text-center">
              <Badge
                variant={plan === 'Enterprise' ? 'platinum' : plan === 'Pro' ? 'gold' : 'silver'}
                size="md"
              >
                {plan}
              </Badge>
              <p className="text-3xl font-bold font-poppins text-primary mt-3 mb-1">
                {PLAN_PRICES[plan]}€
                <span className="text-sm text-slate font-normal">/mois</span>
              </p>
              <p className="text-sm text-slate">
                {countByPlan.find((c) => c.plan === plan)?.count ?? '0'} abonnement(s) actif(s)
              </p>
            </div>
          </Card>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>
      )}

      {/* Table des abonnements */}
      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher une entreprise..."
                value={search}
                onChange={(val) => setSearch(val)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate" />
              <Select
                options={PLAN_OPTIONS}
                value={planFilter}
                onChange={(val) => { setPlanFilter(val); setPage(1); }}
              />
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
        ) : filteredSubs.length === 0 ? (
          <div className="p-8 text-center text-slate">Aucun abonnement trouvé</div>
        ) : (
          <>
            <Table data={filteredSubs} columns={columns} />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {filteredSubs.length} sur {total} abonnement{total > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default SubscriptionsPage;
