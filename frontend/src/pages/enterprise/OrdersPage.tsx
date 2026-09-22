import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChefHat, Clock3, Loader2, RefreshCw, X } from 'lucide-react';
import { getRestaurantOrders, updateRestaurantOrderStatus } from '../../api/restaurantMenuApi';
import type { RestaurantOrder, RestaurantOrderStatus } from '../../api/restaurantMenuApi';

const statusLabels: Record<RestaurantOrderStatus, string> = {
  pending: 'Nouvelle', accepted: 'Acceptée', preparing: 'En préparation', ready: 'Prête', served: 'Servie', cancelled: 'Annulée',
};
const statusClasses: Record<RestaurantOrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700', accepted: 'bg-blue-50 text-blue-700', preparing: 'bg-indigo-50 text-indigo-700', ready: 'bg-green-50 text-green-700', served: 'bg-slate/10 text-slate', cancelled: 'bg-red-50 text-red-700',
};
const nextStatus: Partial<Record<RestaurantOrderStatus, RestaurantOrderStatus>> = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'served' };
const formatPrice = (priceMinor: number) => `${new Intl.NumberFormat('fr-FR').format(priceMinor)} FCFA`;

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      setOrders(await getRestaurantOrders());
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

  return <div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-sm text-slate">Module restaurant</p><h1 className="text-2xl font-bold font-poppins text-dark">Commandes</h1><p className="text-slate mt-1">Les nouvelles commandes sont actualisées automatiquement toutes les 10 secondes.</p></div><button type="button" onClick={() => void loadOrders()} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate/20 bg-white text-dark font-medium hover:bg-cloud"><RefreshCw className="w-4 h-4" />Actualiser</button></div>{error && <div className="rounded-2xl bg-red-50 text-red-700 p-4">{error}</div>}{loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div> : !orders.length ? <div className="rounded-3xl bg-white shadow-soft p-10 text-center"><ChefHat className="w-12 h-12 text-slate/50 mx-auto mb-3" /><h2 className="text-lg font-semibold text-dark">Aucune commande</h2><p className="text-slate mt-1">Les commandes envoyées depuis le menu public apparaîtront ici.</p></div> : <div className="grid gap-5 lg:grid-cols-2">{orders.map((order) => { const next = nextStatus[order.status]; return <article key={order.id} className="rounded-3xl bg-white shadow-soft p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate">#{order.publicOrderToken.slice(0, 8).toUpperCase()} · {new Date(order.createdAt).toLocaleString('fr-FR')}</p><h2 className="text-lg font-bold text-dark mt-1">{order.tableReference || 'Commande à emporter'}</h2></div><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusClasses[order.status]}`}>{statusLabels[order.status]}</span></div><div className="mt-4 space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-dark">{item.quantity} × {item.nameSnapshot}</span><span className="font-medium text-slate whitespace-nowrap">{formatPrice(item.lineTotalMinor)}</span></div>)}</div>{(order.contact || order.customerNote) && <div className="mt-4 rounded-2xl bg-cloud p-3 text-sm text-slate">{order.contact && <p>Contact : {order.contact}</p>}{order.customerNote && <p className="mt-1">Note : {order.customerNote}</p>}</div>}<div className="flex items-center justify-between gap-3 border-t border-slate/10 mt-4 pt-4"><span className="font-bold text-dark">Total : {formatPrice(order.totalMinor)}</span><div className="flex gap-2">{order.status !== 'cancelled' && order.status !== 'served' && <button type="button" disabled={updatingId === order.id} onClick={() => void changeStatus(order, 'cancelled')} className="p-2 rounded-xl text-red-600 hover:bg-red-50" title="Annuler"><X className="w-4 h-4" /></button>}{next && <button type="button" disabled={updatingId === order.id} onClick={() => void changeStatus(order, next)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50">{updatingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : next === 'ready' ? <Check className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}{statusLabels[next]}</button>}</div></div></article>; })}</div>}</div>;
};

export default OrdersPage;
