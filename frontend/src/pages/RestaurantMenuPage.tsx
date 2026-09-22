import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Star, Utensils, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { createPublicReservation, getPublicRestaurantMenu } from '../api/restaurantMenuApi';
import type { PublicRestaurantMenu } from '../api/restaurantMenuApi';

const formatPrice = (priceMinor: number) =>
  `${new Intl.NumberFormat('fr-FR').format(priceMinor)} FCFA`;

const RestaurantMenuPage: React.FC = () => {
  const { enterpriseId = '' } = useParams<{ enterpriseId: string }>();
  const [payload, setPayload] = useState<PublicRestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationForm, setReservationForm] = useState({ reservationDate: '', reservationTime: '', partySize: 2, contact: '' });

  useEffect(() => {
    if (!enterpriseId) return;
    getPublicRestaurantMenu(enterpriseId)
      .then(setPayload)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Menu indisponible'))
      .finally(() => setLoading(false));
  }, [enterpriseId]);

  const today = new Date().toISOString().slice(0, 10);

  const handleReservationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setReservationSubmitting(true);
      setReservationError(null);
      await createPublicReservation(enterpriseId, reservationForm);
      setReservationSuccess(true);
      setReservationForm({ reservationDate: '', reservationTime: '', partySize: 2, contact: '' });
    } catch (requestError) {
      setReservationError(requestError instanceof Error ? requestError.message : 'Impossible d’envoyer la réservation');
    } finally {
      setReservationSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cloud"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  if (error || !payload) {
    return <div className="min-h-screen flex items-center justify-center bg-cloud p-6"><div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-soft"><Utensils className="w-12 h-12 text-primary mx-auto mb-4" /><h1 className="text-xl font-bold text-dark">Menu indisponible</h1><p className="text-slate mt-2">{error || 'Ce menu n’est pas disponible pour le moment.'}</p></div></div>;
  }

  return (
    <main className="min-h-screen bg-cloud pb-12">
      <header className="bg-dark text-white px-5 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            {payload.restaurant.logo ? <img src={payload.restaurant.logo} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white/10" /> : <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center"><Utensils className="w-8 h-8" /></div>}
            <div><p className="text-white/60 text-sm">Menu digital</p><h1 className="text-3xl sm:text-4xl font-bold font-poppins">{payload.restaurant.name}</h1>{payload.restaurant.location && <p className="text-white/70 flex items-center gap-1 mt-2 text-sm"><MapPin className="w-4 h-4" />{payload.restaurant.location}</p>}</div>
          </div>
          <div className="flex flex-wrap gap-3 mt-7">
            <button type="button" onClick={() => { setReservationOpen(true); setReservationSuccess(false); setReservationError(null); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"><CalendarDays className="w-4 h-4" />Réserver une table</button>
            {payload.restaurant.googleReviewUrl && <a href={payload.restaurant.googleReviewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"><Star className="w-4 h-4" />Donner un avis Google</a>}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-5 space-y-5">
        <nav aria-label="Catégories du menu" className="sticky top-3 z-10 bg-white/95 backdrop-blur rounded-2xl shadow-soft p-2 flex gap-2 overflow-x-auto">
          {payload.menu.categories.map((category) => (
            <a key={category.id} href={`#category-${category.id}`} className="whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium text-slate hover:bg-primary/10 hover:text-primary transition-colors">
              {category.name}
            </a>
          ))}
        </nav>
        {payload.menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 bg-white rounded-3xl shadow-soft overflow-hidden">
            <div className="px-5 pt-6 pb-3"><h2 className="text-xl font-bold text-dark">{category.name}</h2>{category.description && <p className="text-sm text-slate mt-1">{category.description}</p>}</div>
            <div className="divide-y divide-slate/10">
              {category.items.map((item) => (
                <article key={item.id} className="px-5 py-5 flex gap-4">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0" />}
                  <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-dark text-lg">{item.name}</h3><span className="text-primary font-bold whitespace-nowrap">{formatPrice(item.priceMinor)}</span></div>{item.description && <p className="text-sm text-slate mt-2 leading-6">{item.description}</p>}</div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {reservationOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4 mb-5"><div><h2 className="text-xl font-bold text-dark">Réserver une table</h2><p className="text-sm text-slate mt-1">Votre demande sera transmise à {payload.restaurant.name}.</p></div><button type="button" onClick={() => setReservationOpen(false)} className="p-2 rounded-xl hover:bg-cloud"><X className="w-5 h-5" /></button></div>
            {reservationSuccess ? <div className="rounded-2xl bg-green-50 text-green-800 p-5 text-center"><CalendarDays className="w-8 h-8 mx-auto mb-2" /><p className="font-semibold">Demande envoyée</p><p className="text-sm mt-1">Le restaurant vous recontactera pour confirmer la réservation.</p><button type="button" onClick={() => setReservationOpen(false)} className="mt-4 px-4 py-2 rounded-xl bg-green-700 text-white font-medium">Fermer</button></div> : <form onSubmit={handleReservationSubmit} className="space-y-4">
              {reservationError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{reservationError}</div>}
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-dark">Date<input type="date" min={today} required value={reservationForm.reservationDate} onChange={(event) => setReservationForm({ ...reservationForm, reservationDate: event.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate/20" /></label><label className="text-sm font-medium text-dark">Heure<input type="time" required value={reservationForm.reservationTime} onChange={(event) => setReservationForm({ ...reservationForm, reservationTime: event.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate/20" /></label></div>
              <label className="text-sm font-medium text-dark">Nombre de couverts<input type="number" min="1" max="100" required value={reservationForm.partySize} onChange={(event) => setReservationForm({ ...reservationForm, partySize: Number(event.target.value) })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate/20" /></label>
              <label className="text-sm font-medium text-dark">Contact (nom, téléphone ou email)<input type="text" minLength={2} maxLength={160} required value={reservationForm.contact} onChange={(event) => setReservationForm({ ...reservationForm, contact: event.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate/20" /></label>
              <button type="submit" disabled={reservationSubmitting} className="w-full px-4 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50">{reservationSubmitting ? 'Envoi...' : 'Envoyer la demande'}</button>
            </form>}
          </div>
        </div>
      )}
    </main>
  );
};

export default RestaurantMenuPage;
