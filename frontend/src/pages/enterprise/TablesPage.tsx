import React, { useCallback, useEffect, useState } from 'react';
import { Armchair, Download, Loader2, Pencil, Plus, QrCode, RefreshCw, Trash2, X } from 'lucide-react';
import { createRestaurantTable, deactivateRestaurantTable, getRestaurantTables, updateRestaurantTable } from '../../api/restaurantMenuApi';
import type { RestaurantTable } from '../../api/restaurantMenuApi';
import { getEnterpriseTableQrCode } from '../../api/enterpriseApi';

type TableForm = { label: string; zone: string; capacity: number };
const emptyForm: TableForm = { label: '', zone: '', capacity: 2 };

const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TableForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ tableLabel: string; targetUrl: string; qrCodeDataUrl: string } | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    try {
      setError(null);
      setTables(await getRestaurantTables());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTables(); }, [loadTables]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.label.trim() || form.capacity < 1) return;
    try {
      setSaving(true);
      setError(null);
      if (editingId) await updateRestaurantTable(editingId, form);
      else await createRestaurantTable(form);
      resetForm();
      await loadTables();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible d’enregistrer la table');
    } finally {
      setSaving(false);
    }
  };

  const editTable = (table: RestaurantTable) => {
    setEditingId(table.id);
    setForm({ label: table.label, zone: table.zone || '', capacity: table.capacity });
  };

  const deactivateTable = async (table: RestaurantTable) => {
    if (!window.confirm(`Désactiver la table « ${table.label} » ?`)) return;
    try {
      setError(null);
      await deactivateRestaurantTable(table.id);
      await loadTables();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de désactiver la table');
    }
  };

  const showTableQr = async (table: RestaurantTable) => {
    try {
      setQrLoadingId(table.id);
      setQrModal(await getEnterpriseTableQrCode(table.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de générer le QR code');
    } finally {
      setQrLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-primary">Module restaurant</p><h1 className="text-2xl font-bold font-poppins text-dark">Tables</h1><p className="mt-1 text-slate">Définissez les tables disponibles pour les réservations.</p></div>
        <button type="button" onClick={() => void loadTables()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate/20 bg-white px-4 py-2.5 font-medium text-dark hover:bg-cloud"><RefreshCw className="h-4 w-4" />Actualiser</button>
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-dark">Configuration des tables</h2><p className="mt-1 text-sm text-slate">Les tables inactives ne sont plus proposées.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{tables.filter((table) => table.status === 'active').length} actives</span></div>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : !tables.length ? <div className="rounded-2xl bg-cloud p-8 text-center text-slate">Aucune table configurée.</div> : <div className="grid gap-3 sm:grid-cols-2">{tables.map((table) => <article key={table.id} className={`rounded-2xl border p-4 ${table.status === 'active' ? 'border-slate/10 bg-[#fcfbfe]' : 'border-slate/10 bg-slate/5 opacity-70'}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Armchair className="h-5 w-5" /></span><div><h3 className="font-semibold text-dark">{table.label}</h3><p className="text-sm text-slate">{table.capacity} {table.capacity > 1 ? 'places' : 'place'}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${table.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate/10 text-slate'}`}>{table.status === 'active' ? 'Active' : 'Inactive'}</span></div><div className="mt-4 flex justify-end gap-1"><button type="button" onClick={() => void showTableQr(table)} disabled={qrLoadingId === table.id} className="rounded-xl p-2 text-slate hover:bg-primary/10 hover:text-primary disabled:opacity-50" aria-label={`Afficher le QR code de ${table.label}`}><QrCode className="h-4 w-4" /></button><button type="button" onClick={() => editTable(table)} className="rounded-xl p-2 text-slate hover:bg-cloud hover:text-primary" aria-label={`Modifier ${table.label}`}><Pencil className="h-4 w-4" /></button>{table.status === 'active' && <button type="button" onClick={() => void deactivateTable(table)} className="rounded-xl p-2 text-red-500 hover:bg-red-50" aria-label={`Désactiver ${table.label}`}><Trash2 className="h-4 w-4" /></button>}</div></article>)}</div>}
        </section>

        <section className="h-fit rounded-3xl bg-white p-5 shadow-soft sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-dark">{editingId ? 'Modifier la table' : 'Ajouter une table'}</h2>{editingId && <button type="button" onClick={resetForm} className="rounded-xl p-2 text-slate hover:bg-cloud" aria-label="Annuler la modification"><X className="h-4 w-4" /></button>}</div><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium text-dark">Nom ou numéro de table<input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} maxLength={80} placeholder="Ex. Table 12" required className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><label className="block text-sm font-medium text-dark">Nombre de places<input type="number" min="1" max="100" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} required className="mt-1 w-full rounded-xl border border-slate/20 px-3 py-2.5" /></label><button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingId ? 'Enregistrer' : 'Ajouter la table'}</button></form></section>
      </div>

      {qrModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl"><div className="mb-4 flex items-center justify-between gap-3 text-left"><div><h3 className="font-semibold text-dark">QR code — {qrModal.tableLabel}</h3><p className="mt-1 text-xs text-slate">Accès direct au menu de cette table</p></div><button type="button" onClick={() => setQrModal(null)} className="rounded-xl p-2 hover:bg-cloud" aria-label="Fermer"><X className="h-5 w-5" /></button></div><img src={qrModal.qrCodeDataUrl} alt={`QR code de ${qrModal.tableLabel}`} className="mx-auto h-64 w-64 rounded-xl border border-slate/10" /><p className="mt-4 break-all text-xs text-slate">{qrModal.targetUrl}</p><a href={qrModal.qrCodeDataUrl} download={`maze-nfc-${qrModal.tableLabel}.png`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90"><Download className="h-4 w-4" />Télécharger le QR</a></div></div>}
    </div>
  );
};

export default TablesPage;
