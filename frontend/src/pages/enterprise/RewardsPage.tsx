import React, { useState, useEffect } from 'react';
import { Plus, Gift, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Select } from '../../components';
import { getRewards, createReward, updateReward, deleteReward, getServices } from '../../api/enterpriseApi';
import type { RewardData, ServiceData } from '../../api/enterpriseApi';

const EMPTY_FORM = { title: '', description: '', pointsRequired: 100, category: '', stock: '', isActive: true, serviceId: '' };

const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RewardData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const [r, s] = await Promise.all([getRewards(), getServices()]);
      setRewards(r);
      setServices(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRewards(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (r: RewardData) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description ?? '',
      pointsRequired: r.pointsRequired,
      category: r.category ?? '',
      stock: r.stock != null ? String(r.stock) : '',
      isActive: r.isActive,
      serviceId: (r as any).serviceId ?? '',
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.pointsRequired) { setSaveError('Titre et points requis sont obligatoires'); return; }
    if (!form.serviceId) { setSaveError('Veuillez sélectionner un service lié'); return; }
    try {
      setSaving(true);
      setSaveError(null);
      const body = {
        title: form.title.trim(),
        description: form.description || undefined,
        pointsRequired: Number(form.pointsRequired),
        category: form.category || undefined,
        stock: form.stock !== '' ? Number(form.stock) : undefined,
        isActive: form.isActive,
        serviceId: form.serviceId,
      };
      if (editing) {
        await updateReward(editing.id, body);
      } else {
        await createReward(body);
      }
      setModalOpen(false);
      fetchRewards();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette récompense ?')) return;
    try {
      await deleteReward(id);
      fetchRewards();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Récompenses</h1>
          <p className="text-slate mt-1">Gérez les récompenses disponibles pour vos clients</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nouvelle récompense</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : rewards.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">Aucune récompense</h3>
              <p className="text-slate">Créez votre première récompense pour vos clients</p>
            </div>
            <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nouvelle récompense</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} padding="none" className="overflow-hidden">
              {reward.image ? (
                <div className="relative h-40 overflow-hidden">
                  <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {reward.category && (
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="primary">{reward.category}</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 bg-primary/10 flex items-center justify-center">
                  <Gift className="w-10 h-10 text-primary/40" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold font-poppins text-dark">{reward.title}</h3>
                  <Badge variant={reward.isActive ? 'active' : 'inactive'} size="sm">
                    {reward.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                {reward.description && <p className="text-sm text-slate mb-3">{reward.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">{reward.pointsRequired.toLocaleString('fr-FR')} pts</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" icon={<Edit className="w-4 h-4" />} onClick={() => openEdit(reward)} />
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(reward.id)} />
                  </div>
                </div>
                {reward.stock != null && (
                  <p className="text-xs text-slate mt-2">Stock : {reward.stock}</p>
                )}
                {(reward as any).serviceId && (
                  <p className="text-xs text-slate mt-1">Service : {services.find(s => s.id === (reward as any).serviceId)?.name ?? '—'}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la récompense' : 'Nouvelle récompense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{saveError}</div>}
          <Input label="Titre *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Menu gratuit" required />
          <Input as="textarea" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description de la récompense" rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Points requis *" type="number" value={form.pointsRequired} onChange={(e) => setForm({ ...form, pointsRequired: Number(e.target.value) })} min="1" required />
            <Input label="Stock (optionnel)" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Illimité" min="0" />
          </div>
          <Input label="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Restaurant, Boutique..." />
          <Select
            label="Service lié *"
            options={services.map(s => ({ value: s.id, label: s.name }))}
            value={form.serviceId}
            onChange={(val) => setForm({ ...form, serviceId: val })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 text-primary rounded border-slate focus:ring-primary" />
            <span className="text-sm font-medium text-dark">Récompense active</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)} disabled={saving}>Annuler</Button>
            <Button type="submit" fullWidth disabled={saving}>{saving ? 'Sauvegarde...' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RewardsPage;
