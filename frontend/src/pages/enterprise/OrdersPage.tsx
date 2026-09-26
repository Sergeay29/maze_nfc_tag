import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChefHat, Clock3, ClipboardList, Loader2, RefreshCw, Utensils, X } from 'lucide-react';
import { getRestaurantOrders, updateRestaurantOrderStatus } from '../../api/restaurantMenuApi';
import type { RestaurantOrder, RestaurantOrderStatus } from '../../api/restaurantMenuApi';

const statusLabels: Record<RestaurantOrderStatus, string> = {
  pending: 'Nouvelle',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  ready: 'Prête',
  served: 'Servie',
  cancelled: 'Annulée',
};

const statusClasses: Record<RestaurantOrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  preparing: 'bg-indigo-50 text-indigo-700',
  ready: 'bg-green-50 text-green-700',
  served: 'bg-slate/10 text-slate',
  cancelled: 'bg-red-50 text-red-700',
};

const nextStatus: Partial<Record<RestaurantOrderStatus, RestaurantOrderStatus>> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const formatPrice = (priceMinor: number) => `${new Intl.NumberFormat('fr-FR').format(priceMinor)} FCFA`;
const formatTime = (createdAt: string) => new Date(createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

type OrderFilter = 'all' | 'new' | 'preparing' | 'ready' | 'completed';

const filterLabels: Record<OrderFilter, string> = {
  all: 'Toutes',
  new: 'Nouvelles',
  preparing: 'En préparation',
  ready: 'Prêtes',
  completed: 'Terminées',
};

const filterMatches = (order: RestaurantOrder, filter: OrderFilter) => {
  if (filter === 'new') return order.status === 'pending' || order.status === 'accepted';
  if (filter === 'preparing') return order.status === 'preparing';
  if (filter === 'ready') return order.status === 'ready';
  if (filter === 'completed') return order.status === 'served' || order.status === 'cancelled';
  return true;
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      setOrders(await getRestaurantOrders());
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const interval = window.setInterval(() => { void loadOrders(); }, 10000);
    return () => window.clearInterval(interval);
  }, [loadOrders]);

  const changeStatus = async (order: RestaurantOrder, status: RestaurantOrderStatus) => {
    try {
      setUpdatingId(order.id);
      const updated = await updateRestaurantOrderStatus(order.id, status);
      setOrders((current) => current.map((currentOrder) => currentOrder.id === updated.id ? updated : currentOrder));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de mettre à jour la commande');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => ({
    new: orders.filter((order) => order.status === 'pending' || order.status === 'accepted').length,
    preparing: orders.filter((order) => order.status === 'preparing').length,
    ready: orders.filter((order) => order.status === 'ready').length,
    total: orders.length,
  }), [orders]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => filterMatches(order, filter)),
    [filter, orders],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Module restaurant</p>
          <h1 className="text-2xl font-bold font-poppins text-dark">Commandes</h1>
          <p className="mt-1 text-slate">Suivez les commandes et faites avancer leur préparation.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="hidden text-xs text-slate sm:inline">Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" onClick={() => void loadOrders()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate/20 bg-white px-4 py-2.5 font-medium text-dark transition-colors hover:bg-cloud">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Nouvelles', value: counts.new, icon: ClipboardList, tone: 'text-amber-600 bg-amber-50' },
          { label: 'En préparation', value: counts.preparing, icon: ChefHat, tone: 'text-indigo-600 bg-indigo-50' },
          { label: 'Prêtes', value: counts.ready, icon: Check, tone: 'text-green-600 bg-green-50' },
          { label: 'Total', value: counts.total, icon: Utensils, tone: 'text-primary bg-primary/10' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate">{label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-3 text-2xl font-bold text-dark">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 shadow-soft sm:w-fit">
        <label htmlFor="orders-filter" className="shrink-0 pl-2 text-sm font-medium text-slate">Filtrer</label>
        <select id="orders-filter" value={filter} onChange={(event) => setFilter(event.target.value as OrderFilter)} className="min-w-0 flex-1 rounded-xl border-0 bg-cloud px-3 py-2 text-sm font-medium text-dark outline-none focus:ring-2 focus:ring-primary/30 sm:w-48 sm:flex-none">
          {(Object.keys(filterLabels) as OrderFilter[]).map((key) => <option key={key} value={key}>{filterLabels[key]}</option>)}
        </select>
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !filteredOrders.length ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <ChefHat className="mx-auto mb-3 h-12 w-12 text-slate/50" />
          <h2 className="text-lg font-semibold text-dark">Aucune commande dans cette vue</h2>
          <p className="mt-1 text-slate">Les nouvelles commandes envoyées depuis le menu public apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => {
            const next = nextStatus[order.status];
            const isUpdating = updatingId === order.id;
            return (
              <article key={order.id} className="flex flex-col rounded-3xl bg-white p-5 shadow-soft transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate">#{order.publicOrderToken.slice(0, 8).toUpperCase()} · {formatTime(order.createdAt)}</p>
                    <h2 className="mt-1 truncate text-lg font-bold text-dark">{order.tableReference || 'Commande à emporter'}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[order.status]}`}>{statusLabels[order.status]}</span>
                </div>

                <div className="mt-4 flex-1 space-y-2 border-y border-slate/10 py-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-dark">{item.quantity} × {item.nameSnapshot}</span>
                      <span className="whitespace-nowrap font-medium text-slate">{formatPrice(item.lineTotalMinor)}</span>
                    </div>
                  ))}
                  {(order.contact || order.customerNote) && <div className="rounded-2xl bg-cloud p-3 text-xs text-slate">{order.contact && <p>Contact : {order.contact}</p>}{order.customerNote && <p className={order.contact ? 'mt-1' : ''}>Note : {order.customerNote}</p>}</div>}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-bold text-dark">{formatPrice(order.totalMinor)}</span>
                  <div className="flex items-center gap-2">
                    {order.status !== 'cancelled' && order.status !== 'served' && <button type="button" disabled={isUpdating} onClick={() => void changeStatus(order, 'cancelled')} className="rounded-xl p-2 text-red-600 transition-colors hover:bg-red-50" title="Annuler" aria-label="Annuler la commande"><X className="h-4 w-4" /></button>}
                    {next && <button type="button" disabled={isUpdating} onClick={() => void changeStatus(order, next)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">{isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : next === 'ready' ? <Check className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}{statusLabels[next]}</button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
