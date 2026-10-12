import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Utensils } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getPublicOrder } from '../api/restaurantMenuApi';
import type { RestaurantOrder, RestaurantOrderStatus } from '../api/restaurantMenuApi';

const labels: Record<RestaurantOrderStatus, string> = {
  pending: 'Commande reçue',
  accepted: 'Commande acceptée',
  preparing: 'En préparation',
  ready: 'Prête à être servie',
  served: 'Commande servie',
  cancelled: 'Commande annulée',
};

const formatPrice = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;

const RestaurantOrderTrackingPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [order, setOrder] = useState<RestaurantOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = () => getPublicOrder(token).then(setOrder).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Commande introuvable'));
    void load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, [token]);

  if (error) return <main className="flex min-h-screen items-center justify-center bg-cloud p-6"><section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-soft"><Utensils className="mx-auto mb-4 h-11 w-11 text-primary" /><h1 className="text-xl font-bold text-dark">Commande introuvable</h1><p className="mt-2 text-slate">{error}</p></section></main>;
  if (!order) return <main className="flex min-h-screen items-center justify-center bg-cloud"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></main>;

  return <main className="min-h-screen bg-cloud px-4 py-10 text-dark sm:px-6"><section className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-soft"><div className="bg-dark px-6 py-7 text-white"><p className="text-sm text-white/65">Suivi de commande</p><h1 className="mt-1 text-2xl font-bold">#{order.publicOrderToken.slice(0, 8).toUpperCase()}</h1></div><div className="p-6"><div className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-primary"><CheckCircle2 className="h-7 w-7 shrink-0" /><div><p className="font-semibold">{labels[order.status]}</p><p className="mt-0.5 text-sm text-slate">{order.tableReference ? `Table ${order.tableReference}` : 'Commande à emporter'}</p></div></div><div className="mt-6 space-y-3">{order.items.map((item) => <div key={item.id} className="rounded-2xl bg-cloud p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{item.quantity} × {item.nameSnapshot}</p><p className="whitespace-nowrap font-semibold text-primary">{formatPrice(item.lineTotalMinor)}</p></div>{item.selectedOptionsSnapshot.map((option) => <p key={option.optionId} className="mt-1 text-sm text-slate">{option.groupName} : {option.name}</p>)}</div>)}</div><div className="mt-6 flex items-center justify-between border-t border-slate/10 pt-5"><span className="font-semibold">Total</span><span className="text-xl font-bold text-primary">{formatPrice(order.totalMinor)}</span></div><p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate"><Clock3 className="h-4 w-4" />Conservez ce code jusqu’à la remise de votre commande.</p></div></section></main>;
};

export default RestaurantOrderTrackingPage;
