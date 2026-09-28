import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, Loader2, RefreshCw, Users, X } from 'lucide-react';
import { getRestaurantReservations, updateRestaurantReservationStatus } from '../../api/restaurantMenuApi';
import type { RestaurantReservation, RestaurantReservationStatus } from '../../api/restaurantMenuApi';

const statusLabels: Record<RestaurantReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

const statusClasses: Record<RestaurantReservationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const formatDate = (reservation: RestaurantReservation) => new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date(`${reservation.reservationDate}T${reservation.reservationTime}:00`));

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | RestaurantReservationStatus>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadReservations = useCallback(async () => {
    try {
      setError(null);
      setReservations(await getRestaurantReservations());
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les réservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
    const interval = window.setInterval(() => { void loadReservations(); }, 30000);
    return () => window.clearInterval(interval);
  }, [loadReservations]);

  const changeStatus = async (reservation: RestaurantReservation, status: RestaurantReservationStatus) => {
    try {
      setUpdatingId(reservation.id);
      const updated = await updateRestaurantReservationStatus(reservation.id, status);
      setReservations((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de modifier la réservation');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => ({
    pending: reservations.filter((item) => item.status === 'pending').length,
    confirmed: reservations.filter((item) => item.status === 'confirmed').length,
    cancelled: reservations.filter((item) => item.status === 'cancelled').length,
  }), [reservations]);

  const visibleReservations = useMemo(
    () => filter === 'all' ? reservations : reservations.filter((item) => item.status === filter),
    [filter, reservations],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Module restaurant</p>
          <h1 className="text-2xl font-bold font-poppins text-dark">Réservations</h1>
          <p className="mt-1 text-slate">Consultez les demandes et confirmez les arrivées prévues.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="hidden text-xs text-slate sm:inline">Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" onClick={() => void loadReservations()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate/20 bg-white px-4 py-2.5 font-medium text-dark hover:bg-cloud"><RefreshCw className="h-4 w-4" />Actualiser</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'En attente', value: counts.pending, icon: Clock3, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Confirmées', value: counts.confirmed, icon: Check, tone: 'bg-green-50 text-green-600' },
          { label: 'Annulées', value: counts.cancelled, icon: X, tone: 'bg-red-50 text-red-600' },
        ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl bg-white p-4 shadow-soft"><div className="flex items-center justify-between gap-2"><p className="text-xs text-slate sm:text-sm">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-2xl font-bold text-dark">{value}</p></div>)}
      </div>

      <div className="flex w-full items-center gap-3 rounded-2xl bg-white p-2 shadow-soft sm:w-fit">
        <label htmlFor="reservation-filter" className="pl-2 text-sm font-medium text-slate">Filtrer</label>
        <select id="reservation-filter" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | RestaurantReservationStatus)} className="min-w-0 flex-1 rounded-xl border-0 bg-cloud px-3 py-2 text-sm font-medium text-dark outline-none focus:ring-2 focus:ring-primary/30 sm:w-44 sm:flex-none">
          <option value="all">Toutes</option><option value="pending">En attente</option><option value="confirmed">Confirmées</option><option value="cancelled">Annulées</option>
        </select>
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : !visibleReservations.length ? <div className="rounded-3xl bg-white p-10 text-center shadow-soft"><CalendarDays className="mx-auto mb-3 h-12 w-12 text-slate/50" /><h2 className="text-lg font-semibold text-dark">Aucune réservation</h2><p className="mt-1 text-slate">Les demandes envoyées depuis le menu public apparaîtront ici.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleReservations.map((reservation) => { const isUpdating = updatingId === reservation.id; return <article key={reservation.id} className="rounded-3xl bg-white p-5 shadow-soft"><div className="flex items-start justify-between gap-3"><div><p className="text-xs capitalize text-slate">{formatDate(reservation)}</p><h2 className="mt-1 text-lg font-bold text-dark">{reservation.reservationTime}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[reservation.status]}`}>{statusLabels[reservation.status]}</span></div><div className="mt-4 space-y-3 border-y border-slate/10 py-4"><div className="flex items-center gap-2 text-sm text-slate"><Users className="h-4 w-4 text-primary" /><span>{reservation.partySize} {reservation.partySize > 1 ? 'couverts' : 'couvert'}</span></div><p className="rounded-2xl bg-cloud p-3 text-sm text-dark">{reservation.contact}</p></div>{reservation.status !== 'cancelled' && <div className="mt-4 flex justify-end gap-2">{reservation.status === 'pending' && <button type="button" disabled={isUpdating} onClick={() => void changeStatus(reservation, 'confirmed')} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Confirmer</button>}<button type="button" disabled={isUpdating} onClick={() => void changeStatus(reservation, 'cancelled')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><X className="h-4 w-4" />Annuler</button></div>}</article>; })}</div>}
    </div>
  );
};

export default ReservationsPage;
