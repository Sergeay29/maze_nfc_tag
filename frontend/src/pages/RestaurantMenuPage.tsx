import React, { useEffect, useState } from 'react';
import { MapPin, Utensils } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getPublicRestaurantMenu } from '../api/restaurantMenuApi';
import type { PublicRestaurantMenu } from '../api/restaurantMenuApi';

const formatPrice = (priceMinor: number) =>
  `${new Intl.NumberFormat('fr-FR').format(priceMinor)} FCFA`;

const RestaurantMenuPage: React.FC = () => {
  const { enterpriseId = '' } = useParams<{ enterpriseId: string }>();
  const [payload, setPayload] = useState<PublicRestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enterpriseId) return;
    getPublicRestaurantMenu(enterpriseId)
      .then(setPayload)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Menu indisponible'))
      .finally(() => setLoading(false));
  }, [enterpriseId]);

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
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-5 space-y-5">
        {payload.menu.categories.map((category) => (
          <section key={category.id} className="bg-white rounded-3xl shadow-soft overflow-hidden">
            <div className="px-5 pt-6 pb-3"><h2 className="text-xl font-bold text-dark">{category.name}</h2>{category.description && <p className="text-sm text-slate mt-1">{category.description}</p>}</div>
            <div className="divide-y divide-slate/10">
              {category.items.map((item) => (
                <article key={item.id} className="px-5 py-5 flex gap-4">
                  {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0" />}
                  <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-dark text-lg">{item.name}</h3><span className="text-primary font-bold whitespace-nowrap">{formatPrice(item.priceMinor)}</span></div>{item.description && <p className="text-sm text-slate mt-2 leading-6">{item.description}</p>}</div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default RestaurantMenuPage;
