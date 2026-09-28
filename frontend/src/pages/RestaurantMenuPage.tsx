import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, MapPin, Minus, Plus, ShoppingBag, Star, Trash2, Utensils, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { createPublicOrder, createPublicReservation, getPublicOrder, getPublicRestaurantMenu, getPublicTableMenu } from '../api/restaurantMenuApi';
import type { PublicRestaurantMenu, RestaurantMenuItem, RestaurantOrder } from '../api/restaurantMenuApi';

const formatPrice = (priceMinor: number) => `${new Intl.NumberFormat('fr-FR').format(priceMinor)} FCFA`;

const getItemDescription = (description?: string | null) => {
  const value = description?.trim();
  return value && value.toLowerCase() !== 'description optionnelle' ? value : null;
};

type CartEntry = { menuItemId: string; optionIds: string[]; quantity: number };
type CartLine = { key: string; item: RestaurantMenuItem; optionIds: string[]; quantity: number };

const getCartKey = (menuItemId: string, optionIds: string[]) => `${menuItemId}:${[...optionIds].sort().join(',')}`;

const RestaurantMenuPage: React.FC = () => {
  const { enterpriseId = '', publicToken = '' } = useParams<{ enterpriseId: string; publicToken: string }>();
  const menuIdentifier = enterpriseId || publicToken;
  const [payload, setPayload] = useState<PublicRestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [configuringItem, setConfiguringItem] = useState<RestaurantMenuItem | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string[]>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [order, setOrder] = useState<RestaurantOrder | null>(null);
  const [orderForm, setOrderForm] = useState({ tableReference: '', contact: '', customerNote: '' });
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationForm, setReservationForm] = useState({ reservationDate: '', reservationTime: '', partySize: 2, contact: '' });

  useEffect(() => {
    if (!menuIdentifier) return;
    (publicToken ? getPublicTableMenu(publicToken) : getPublicRestaurantMenu(enterpriseId))
      .then(setPayload)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Menu indisponible'))
      .finally(() => setLoading(false));
  }, [enterpriseId, menuIdentifier, publicToken]);

  useEffect(() => {
    if (!order?.publicOrderToken) return undefined;
    const refresh = () => getPublicOrder(order.publicOrderToken).then(setOrder).catch(() => undefined);
    const interval = window.setInterval(refresh, 10000);
    return () => window.clearInterval(interval);
  }, [order?.publicOrderToken]);

  const availableCategories = useMemo(
    () => payload?.menu.categories.filter((category) => category.items.length > 0) || [],
    [payload],
  );
  const menuItems = useMemo<RestaurantMenuItem[]>(
    () => availableCategories.flatMap((category) => category.items),
    [availableCategories],
  );
  const cartLines = useMemo<CartLine[]>(
    () => Object.entries(cart).flatMap(([key, entry]) => {
      const item = menuItems.find((menuItem) => menuItem.id === entry.menuItemId);
      return item ? [{ key, item, optionIds: entry.optionIds, quantity: entry.quantity }] : [];
    }),
    [cart, menuItems],
  );
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const getLineUnitPrice = (item: RestaurantMenuItem, optionIds: string[]) => item.priceMinor + (item.optionGroups || []).flatMap((group) => group.options).filter((option) => optionIds.includes(option.id)).reduce((sum, option) => sum + option.priceModifierMinor, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + getLineUnitPrice(line.item, line.optionIds) * line.quantity, 0);
  const today = new Date().toISOString().slice(0, 10);

  const updateQuantity = (key: string, quantity: number, item?: RestaurantMenuItem, optionIds?: string[]) => {
    setCart((current) => {
      const next = { ...current };
      const resolvedKey = next[key] ? key : Object.keys(next).find((entryKey) => next[entryKey].menuItemId === key);
      if (quantity <= 0 && resolvedKey) delete next[resolvedKey];
      else if (resolvedKey) next[resolvedKey] = { ...next[resolvedKey], quantity: Math.min(quantity, 20) };
      else if (item && optionIds) next[key] = { menuItemId: item.id, optionIds, quantity: Math.min(quantity, 20) };
      return next;
    });
  };

  const openItemConfiguration = (item: RestaurantMenuItem) => {
    const activeGroups = (item.optionGroups || []).filter((group) => group.isActive);
    if (!activeGroups.length) {
      const key = getCartKey(item.id, []);
      updateQuantity(key, (cart[key]?.quantity || 0) + 1, item, []);
      return;
    }
    setConfiguringItem(item);
    setSelectedOptionIds({});
    setSelectionError(null);
  };

  const toggleOption = (groupId: string, optionId: string, selectionType: 'single' | 'multiple', maxSelections: number) => {
    setSelectedOptionIds((current) => {
      const selected = current[groupId] || [];
      if (selected.includes(optionId)) return { ...current, [groupId]: selected.filter((id) => id !== optionId) };
      if (selectionType === 'single') return { ...current, [groupId]: [optionId] };
      if (selected.length >= maxSelections) return current;
      return { ...current, [groupId]: [...selected, optionId] };
    });
  };

  const addConfiguredItem = () => {
    if (!configuringItem) return;
    const activeGroups = (configuringItem.optionGroups || []).filter((group) => group.isActive);
    const invalidGroup = activeGroups.find((group) => {
      const count = (selectedOptionIds[group.id] || []).length;
      return count < group.minSelections || count > group.maxSelections;
    });
    if (invalidGroup) {
      setSelectionError(`Complétez le choix « ${invalidGroup.name} » avant d’ajouter ce plat.`);
      return;
    }
    const optionIds = activeGroups.flatMap((group) => selectedOptionIds[group.id] || []);
    const key = getCartKey(configuringItem.id, optionIds);
    updateQuantity(key, (cart[key]?.quantity || 0) + 1, configuringItem, optionIds);
    setConfiguringItem(null);
  };

  const handleOrderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cartLines.length) return;
    try {
      setOrderSubmitting(true);
      setOrderError(null);
      const createdOrder = await createPublicOrder(payload?.restaurant.id || enterpriseId, {
        items: cartLines.map(({ item, optionIds, quantity }) => ({ menuItemId: item.id, optionIds, quantity })),
        tableReference: orderForm.tableReference,
        contact: orderForm.contact,
        customerNote: orderForm.customerNote,
      });
      setOrder(createdOrder);
      setCart({});
      setCartOpen(false);
      setOrderDetailsOpen(false);
      setOrderForm({ tableReference: '', contact: '', customerNote: '' });
    } catch (requestError) {
      setOrderError(requestError instanceof Error ? requestError.message : 'Impossible d’envoyer la commande');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleReservationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setReservationSubmitting(true);
      setReservationError(null);
      await createPublicReservation(payload?.restaurant.id || enterpriseId, reservationForm);
      setReservationSuccess(true);
      setOrderForm((current) => ({ ...current, contact: reservationForm.contact }));
      setReservationForm({ reservationDate: '', reservationTime: '', partySize: 2, contact: '' });
    } catch (requestError) {
      setReservationError(requestError instanceof Error ? requestError.message : 'Impossible d’envoyer la réservation');
    } finally {
      setReservationSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-cloud"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" /></div>;
  if (error || !payload) return <div className="flex min-h-screen items-center justify-center bg-cloud p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-soft"><Utensils className="mx-auto mb-4 h-12 w-12 text-primary" /><h1 className="text-xl font-bold text-dark">Menu indisponible</h1><p className="mt-2 text-slate">{error || 'Ce menu n’est pas disponible pour le moment.'}</p></div></div>;

  return (
    <main className="min-h-screen bg-[#f8f7fb] pb-28 text-dark">
      <header className="relative overflow-hidden bg-dark text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-fuchsia-500/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {payload.restaurant.logo ? <img src={payload.restaurant.logo} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/20 sm:h-20 sm:w-20" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary sm:h-20 sm:w-20"><Utensils className="h-8 w-8" /></div>}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/60">Menu digital</p>
                <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-4xl">{payload.restaurant.name}</h1>
                {payload.restaurant.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70"><MapPin className="h-4 w-4 shrink-0" />{payload.restaurant.location}</p>}
                {payload.table && <p className="mt-2 text-sm font-semibold text-white/80">Table {payload.table.label}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button type="button" onClick={() => { setReservationOpen(true); setReservationSuccess(false); setReservationError(null); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"><CalendarDays className="h-4 w-4" />Réserver une table</button>
              {payload.restaurant.googleReviewUrl && <a href={payload.restaurant.googleReviewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"><Star className="h-4 w-4" />Donner un avis</a>}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Catégories du menu" className="sticky top-3 z-10 -mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-white/95 p-2 shadow-soft backdrop-blur">
          {availableCategories.map((category) => <a key={category.id} href={`#category-${category.id}`} className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-slate transition-colors hover:bg-primary/10 hover:text-primary">{category.name}</a>)}
        </nav>

        {availableCategories.length === 0 ? (
          <section className="mt-6 rounded-3xl bg-white p-10 text-center shadow-soft"><h2 className="text-xl font-bold">Menu en préparation</h2><p className="mt-2 text-slate">Aucun plat n’est disponible pour le moment.</p></section>
        ) : (
          <div className="mt-6 space-y-6">
            {availableCategories.map((category) => (
              <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 rounded-3xl bg-white p-4 shadow-soft sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-3 border-b border-slate/10 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catégorie</p><h2 className="mt-1 text-2xl font-bold">{category.name}</h2>{category.description && <p className="mt-1 text-sm text-slate">{category.description}</p>}</div><span className="rounded-full bg-cloud px-3 py-1 text-xs font-semibold text-slate">{category.items.length} {category.items.length > 1 ? 'plats' : 'plat'}</span></div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {category.items.map((item) => (
                    <article key={item.id} className="flex min-w-0 gap-4 rounded-2xl border border-slate/10 bg-[#fcfbfe] p-3 transition-shadow hover:shadow-soft sm:p-4">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28" /> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:h-28 sm:w-28"><Utensils className="h-8 w-8 text-primary" /></div>}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words text-base font-bold sm:text-lg">{item.name}</h3><span className="shrink-0 text-sm font-bold text-primary sm:text-base">{formatPrice(item.priceMinor)}</span></div>
                        {getItemDescription(item.description) && <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate">{getItemDescription(item.description)}</p>}
                        <button type="button" onClick={() => openItemConfiguration(item)} className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"><Plus className="h-4 w-4" />Ajouter</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {cartCount > 0 && <button type="button" onClick={() => { setCartOpen(true); setOrderError(null); setOrderDetailsOpen(false); }} className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-dark px-5 py-4 text-white shadow-xl"><span className="inline-flex items-center gap-3 font-semibold"><ShoppingBag className="h-5 w-5" />Voir le panier <span className="rounded-full bg-primary px-2 py-0.5 text-sm">{cartCount}</span></span><span className="font-bold">{formatPrice(cartTotal)}</span></button>}

      {configuringItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Personnalisez votre plat</p><h2 className="text-2xl font-bold">{configuringItem.name}</h2></div><button type="button" onClick={() => setConfiguringItem(null)} className="rounded-xl p-2 hover:bg-cloud" aria-label="Fermer"><X className="h-5 w-5" /></button></div>{selectionError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{selectionError}</div>}<div className="space-y-4">{(configuringItem.optionGroups || []).filter((group) => group.isActive).map((group) => <section key={group.id} className="rounded-2xl bg-cloud p-4"><div className="mb-3"><h3 className="font-semibold">{group.name}</h3><p className="mt-1 text-xs text-slate">{group.minSelections > 0 ? `${group.minSelections} choix requis` : 'Facultatif'} · {group.selectionType === 'single' ? 'un choix' : `${group.maxSelections} choix maximum`}</p></div><div className="space-y-2">{group.options.map((option) => { const selected = (selectedOptionIds[group.id] || []).includes(option.id); return <button key={option.id} type="button" onClick={() => toggleOption(group.id, option.id, group.selectionType, group.maxSelections)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-slate/15 bg-white text-dark'}`}><span className="font-medium">{option.name}</span><span>{option.priceModifierMinor ? `+ ${formatPrice(option.priceModifierMinor)}` : 'Inclus'}</span></button>; })}</div></section>)}</div><div className="mt-5 flex items-center justify-between border-t border-slate/10 pt-4"><span className="font-semibold">Prix</span><span className="text-xl font-bold text-primary">{formatPrice(getLineUnitPrice(configuringItem, Object.values(selectedOptionIds).flat()))}</span></div><button type="button" onClick={addConfiguredItem} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white">Ajouter au panier</button></div></div>}

      {cartOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Votre sélection</p><h2 className="text-2xl font-bold">Votre panier</h2><p className="mt-1 text-sm text-slate">Vérifiez votre commande avant envoi.</p></div><button type="button" onClick={() => setCartOpen(false)} className="rounded-xl p-2 hover:bg-cloud" aria-label="Fermer"><X className="h-5 w-5" /></button></div>{orderError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{orderError}</div>}<div className="mb-5 space-y-3">{cartLines.map(({ key, item, optionIds, quantity }) => <div key={key} className="flex items-center gap-3 rounded-2xl bg-cloud p-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p>{optionIds.length > 0 && <p className="truncate text-xs text-slate">{(item.optionGroups || []).flatMap((group) => group.options).filter((option) => optionIds.includes(option.id)).map((option) => option.name).join(' · ')}</p>}<p className="text-sm text-slate">{quantity} × {formatPrice(getLineUnitPrice(item, optionIds))}</p></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => updateQuantity(key, quantity - 1)} className="rounded-lg bg-white p-1.5"><Minus className="h-4 w-4" /></button><span className="w-5 text-center text-sm font-semibold">{quantity}</span><button type="button" onClick={() => updateQuantity(key, quantity + 1)} className="rounded-lg bg-white p-1.5"><Plus className="h-4 w-4" /></button><button type="button" onClick={() => updateQuantity(key, 0)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label={`Supprimer ${item.name}`}><Trash2 className="h-4 w-4" /></button></div></div>)}</div><form onSubmit={handleOrderSubmit} className="space-y-4"><button type="button" onClick={() => setOrderDetailsOpen((current) => !current)} className="w-full rounded-xl border border-slate/20 px-4 py-3 text-sm font-semibold text-dark hover:bg-cloud">{orderDetailsOpen ? 'Masquer les informations facultatives' : 'Ajouter des informations facultatives'}</button>{orderDetailsOpen && <div className="space-y-4"><label className="block text-sm font-medium">Table (facultatif)<input value={orderForm.tableReference} onChange={(event) => setOrderForm({ ...orderForm, tableReference: event.target.value })} maxLength={80} placeholder="Ex. Table 12" className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><label className="block text-sm font-medium">Contact (facultatif)<input value={orderForm.contact} onChange={(event) => setOrderForm({ ...orderForm, contact: event.target.value })} maxLength={160} placeholder="Nom ou téléphone" className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><label className="block text-sm font-medium">Note pour la cuisine (facultatif)<textarea value={orderForm.customerNote} onChange={(event) => setOrderForm({ ...orderForm, customerNote: event.target.value })} maxLength={1000} rows={2} className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label></div>}<div className="flex items-center justify-between border-t border-slate/10 pt-4"><span className="font-semibold">Total</span><span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span></div><button type="submit" disabled={orderSubmitting} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">{orderSubmitting ? 'Envoi…' : 'Envoyer la commande'}</button></form></div></div>}

      {order && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl"><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" /><h2 className="text-xl font-bold">Commande envoyée</h2><p className="mt-2 text-slate">Référence : <strong>{order.publicOrderToken.slice(0, 8).toUpperCase()}</strong></p><p className="mt-1 text-slate">Statut : <strong>{order.status === 'pending' ? 'En attente de prise en charge' : order.status}</strong></p><p className="mt-4 text-2xl font-bold text-primary">{formatPrice(order.totalMinor)}</p><p className="mt-3 text-xs text-slate">Le statut se met à jour automatiquement.</p><button type="button" onClick={() => setOrder(null)} className="mt-5 rounded-xl bg-dark px-5 py-2.5 font-semibold text-white">Fermer</button></div></div>}

      {reservationOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Réservation</p><h2 className="text-xl font-bold">Réserver une table</h2><p className="mt-1 text-sm text-slate">Votre demande sera transmise à {payload.restaurant.name}.</p></div><button type="button" onClick={() => setReservationOpen(false)} className="rounded-xl p-2 hover:bg-cloud" aria-label="Fermer"><X className="h-5 w-5" /></button></div>{reservationSuccess ? <div className="rounded-2xl bg-green-50 p-5 text-center text-green-800"><CalendarDays className="mx-auto mb-2 h-8 w-8" /><p className="font-semibold">Demande envoyée</p><p className="mt-1 text-sm">Le restaurant vous recontactera pour confirmer la réservation.</p><button type="button" onClick={() => setReservationOpen(false)} className="mt-4 rounded-xl bg-green-700 px-4 py-2 font-medium text-white">Fermer</button></div> : <form onSubmit={handleReservationSubmit} className="space-y-4">{reservationError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{reservationError}</div>}<div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Date<input type="date" min={today} required value={reservationForm.reservationDate} onChange={(event) => setReservationForm({ ...reservationForm, reservationDate: event.target.value })} className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><label className="block text-sm font-medium">Heure<input type="time" required value={reservationForm.reservationTime} onChange={(event) => setReservationForm({ ...reservationForm, reservationTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label></div><label className="block text-sm font-medium">Nombre de couverts<input type="number" min="1" max="100" required value={reservationForm.partySize} onChange={(event) => setReservationForm({ ...reservationForm, partySize: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><label className="block text-sm font-medium">Contact (nom, téléphone ou email)<input type="text" minLength={2} maxLength={160} required value={reservationForm.contact} onChange={(event) => setReservationForm({ ...reservationForm, contact: event.target.value })} className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><button type="submit" disabled={reservationSubmitting} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">{reservationSubmitting ? 'Envoi…' : 'Envoyer la demande'}</button></form>}</div></div>}
    </main>
  );
};

export default RestaurantMenuPage;
