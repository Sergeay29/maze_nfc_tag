import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Users, ChevronRight, ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { Card, Badge, Avatar, Button, Modal, Input, Toast } from '../../components';
import { getCardTypes, getCardTypeDetail, createCardType, updateCardType, deleteCardType } from '../../api/adminApi';
import type { CardTypeData, CardTypeDetail } from '../../api/adminApi';

const DEFAULT_ICON = <CreditCard className="w-6 h-6" />;
const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Fidélité Entreprise': <CreditCard className="w-6 h-6" />,
  'Restaurant': <QrCode className="w-6 h-6" />,
  'Carte de visite': <Users className="w-6 h-6" />,
};

const EMPTY_FORM = { name: '', description: '', subtypes: [] as string[] };

const ModulesPage: React.FC = () => {
  const [types, setTypes] = useState<CardTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<CardTypeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CardTypeData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<CardTypeData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const fetchTypes = () => {
    setLoading(true);
    getCardTypes()
      .then(setTypes)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleSelect = async (t: CardTypeData) => {
    setSelected(t.type);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await getCardTypeDetail(t.id);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, t: CardTypeData) => {
    e.stopPropagation();
    setEditing(t);
    setForm({ 
      name: t.type, 
      description: t.description ?? '', 
      subtypes: [...(t.subtypes || [])] 
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, t: CardTypeData) => {
    e.stopPropagation();
    setDeletingType(t);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingType) return;
    try {
      setDeleting(true);
      await deleteCardType(deletingType.id);
      fetchTypes();
      setDeleteModalOpen(false);
      setToast({ message: `Type "${deletingType.type}" supprimé avec succès !`, variant: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la suppression', variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const addSubtype = () => {
    setForm(prev => ({ ...prev, subtypes: [...prev.subtypes, ''] }));
  };

  const removeSubtype = (index: number) => {
    setForm(prev => ({ 
      ...prev, 
      subtypes: prev.subtypes.filter((_, i) => i !== index) 
    }));
  };

  const updateSubtype = (index: number, value: string) => {
    setForm(prev => ({ 
      ...prev, 
      subtypes: prev.subtypes.map((subtype, i) => i === index ? value : subtype) 
    }));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.name.trim()) { setSaveError('Le nom est requis'); return; }
    // Filter out empty subtypes
    const filteredSubtypes = form.subtypes.filter(s => s.trim() !== '');
    try {
      setSaving(true);
      setSaveError(null);
      if (editing) {
        await updateCardType(editing.id, { 
          name: form.name.trim(), 
          description: form.description || undefined,
          subtypes: filteredSubtypes // On envoie le tableau, même vide !
        });
        setToast({ message: `Type "${form.name.trim()}" mis à jour avec succès !`, variant: 'success' });
      } else {
        await createCardType({ 
          name: form.name.trim(), 
          description: form.description || undefined,
          subtypes: filteredSubtypes // On envoie le tableau, même vide !
        });
        setToast({ message: `Type "${form.name.trim()}" créé avec succès !`, variant: 'success' });
      }
      setModalOpen(false);
      fetchTypes();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <div className="space-y-6 animate-fade-in">
        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        )}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-cloud transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-poppins text-dark">{selected}</h1>
            <p className="text-slate mt-1">Entreprises utilisant ce type de carte</p>
          </div>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : detail && detail.enterprises.length === 0 ? (
          <Card className="py-16 text-center">
            <p className="text-slate">Aucune entreprise n'utilise ce type de carte</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detail?.enterprises.map((e) => (
              <Card key={e.id} hover>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar src={e.logo} name={e.name} size="md" shape="rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark truncate">{e.name}</p>
                    <Badge variant={e.status === 'active' ? 'active' : 'inactive'} size="sm">
                      {e.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-cloud rounded-xl p-2">
                    <p className="text-lg font-bold text-dark">{e.totalCards}</p>
                    <p className="text-xs text-slate">Cartes</p>
                  </div>
                  <div className="bg-cloud rounded-xl p-2">
                    <p className="text-lg font-bold text-primary">{e.activeCards}</p>
                    <p className="text-xs text-slate">Actives</p>
                  </div>
                  <div className="bg-cloud rounded-xl p-2">
                    <p className="text-lg font-bold text-dark">{e.totalScans}</p>
                    <p className="text-xs text-slate">Scans</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Types de cartes</h1>
          <p className="text-slate mt-1">Gérez les types de cartes NFC disponibles</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>Nouveau type</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {types.map((t) => (
            <Card key={t.id} hover className="cursor-pointer" onClick={() => handleSelect(t)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center text-white flex-shrink-0">
                  {TYPE_ICONS[t.type] ?? DEFAULT_ICON}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold font-poppins text-dark mb-1">{t.type}</h3>
                  {t.description && <p className="text-xs text-slate mb-1">{t.description}</p>}
                  {t.subtypes && t.subtypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.subtypes.map((subtype, i) => (
                        <Badge key={i} variant="primary" size="sm">{subtype}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-slate mb-3">{t.enterprises.length} entreprise{t.enterprises.length > 1 ? 's' : ''}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-slate">
                      <span><strong className="text-dark">{t.totalCards}</strong> cartes</span>
                      <span><strong className="text-dark">{t.totalScans}</strong> scans</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEdit(e, t)}
                        className="p-1 rounded-lg hover:bg-cloud text-slate hover:text-dark transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, t)}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le type' : 'Nouveau type de carte'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{saveError}</div>}
          <Input label="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Carte Fidélité" required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description optionnelle" />
          
          {/* Subtypes section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-dark">Sous-types</label>
              <Button type="button" variant="ghost" size="sm" onClick={addSubtype} icon={<Plus className="w-4 h-4" />}>
                Ajouter
              </Button>
            </div>
            {form.subtypes.map((subtype, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Ex: Standard, Premium"
                  value={subtype}
                  onChange={(e) => updateSubtype(index, e.target.value)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSubtype(index)}
                  className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)} disabled={saving}>Annuler</Button>
            <Button type="submit" fullWidth disabled={saving}>{saving ? 'Sauvegarde...' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modale de confirmation de suppression */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Supprimer le type de carte" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate">
            Êtes-vous sûr de vouloir supprimer le type <strong className="text-dark">"{deletingType?.type}"</strong> ?
          </p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Annuler
            </Button>
            <Button type="button" variant="danger" fullWidth onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModulesPage;
