import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Copy, Check, Sparkles, Link, Trash2, Edit2, Power } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Modal, Input, Select, PhoneInput, Avatar, LogoUpload, Toast } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getEnterprises, createEnterprise, updateEnterprise, deleteEnterprise, uploadLogo } from '../../api/adminApi';
import { isValidPhoneNumber } from 'react-phone-number-input';
import type { Enterprise } from '../../data/mockData';
import type { CardType } from '../../@types/types';

const SUBSCRIPTION_OPTIONS = [
  { value: 'Starter', label: 'Starter — 29€/mois' },
  { value: 'Pro', label: 'Pro — 79€/mois' },
  { value: 'Enterprise', label: 'Enterprise — 199€/mois' },
];

interface CreateEnterpriseForm {
  name: string;
  email: string;
  phone: string;
  location: string;
  adminFirstName: string;
  adminLastName: string;
  subscription: 'Starter' | 'Pro' | 'Enterprise';
  logo: string;
}

interface CreateCardsOptions {
  enabled: boolean;
  type: CardType | '';
  subtype: string;
  scanBaseUrl: string;
  quantity: string;
}

const EMPTY_FORM: CreateEnterpriseForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  adminFirstName: '',
  adminLastName: '',
  subscription: 'Starter',
  logo: '',
};

const EMPTY_CARD_OPTIONS: CreateCardsOptions = {
  enabled: false,
  type: 'Fidélité Entreprise',
  subtype: '',
  scanBaseUrl: '', // Vide par défaut, utilisera SCAN_BASE_URL du backend
  quantity: '100',
};

const CARD_TYPE_OPTIONS = [
  { value: 'Fidélité Entreprise', label: 'Fidélité Entreprise' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Carte de visite', label: 'Carte de visite' },
];

const CARD_SUBTYPE_OPTIONS = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Luxe', label: 'Luxe' },
];

// Validation email simple
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const PAGE_SIZE = 10;

const EnterprisesPage: React.FC = () => {
  const [allEnterprises, setAllEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateEnterpriseForm>(EMPTY_FORM);
  const [cardOptions, setCardOptions] = useState<CreateCardsOptions>(EMPTY_CARD_OPTIONS);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof CreateEnterpriseForm, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── États modale édition ──────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateEnterpriseForm>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // ── États modale confirmation suppression ─────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEnterprise, setDeletingEnterprise] = useState<Enterprise | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Toast ────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  // ── Validation par champ ──────────────────────────────────
  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof CreateEnterpriseForm, string>> = {};
    if (!form.name.trim()) errors.name = 'Le nom est obligatoire';
    if (!form.email.trim()) {
      errors.email = "L'adresse mail est obligatoire";
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Cette adresse mail est invalide';
    }
    if (form.phone && !isValidPhoneNumber(form.phone)) {
      errors.phone = 'Numéro de téléphone invalide';
    }
    return errors;
  }, [form]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEnterprises({ page: 1, limit: 500 });
      setAllEnterprises(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnterprises(); }, []);

  const filtered = useMemo(() => {
    let list = allEnterprises;
    if (statusFilter !== 'all') list = list.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.location ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEnterprises, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val: string) => { setStatusFilter(val as typeof statusFilter); setPage(1); };

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setCardOptions(EMPTY_CARD_OPTIONS);
    setLogoFile(null);
    setTouched({});
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleFieldChange = (field: keyof CreateEnterpriseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof CreateEnterpriseForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });
    if (!isFormValid) return;

    if (cardOptions.enabled) {
      if (!cardOptions.type) {
        setFormError('Veuillez choisir un type de carte si vous souhaitez en générer.');
        return;
      }
      if (cardOptions.type === 'Restaurant' && !cardOptions.subtype) {
        setFormError('Veuillez choisir un sous-type pour les cartes Restaurant.');
        return;
      }
      const qty = Number(cardOptions.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
        setFormError('La quantité doit être comprise entre 1 et 1000.');
        return;
      }
    }

    try {
      setCreating(true);
      setFormError(null);

      let logoUrl = form.logo.trim() || undefined;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      const result = await createEnterprise({
        ...form,
        logo: logoUrl,
        cardGeneration: cardOptions.enabled ? {
          enabled: true,
          type: cardOptions.type,
          subtype: cardOptions.type === 'Restaurant' ? cardOptions.subtype : undefined,
          scanBaseUrl: cardOptions.scanBaseUrl.trim() || undefined, // Utilisera SCAN_BASE_URL du backend si vide
          quantity: Number(cardOptions.quantity),
        } : undefined,
      });

      setShowCreateModal(false);
      setGeneratedPassword(result.generatedPassword ?? null);
      setPasswordCopied(false);
      await fetchEnterprises();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  // ── Handlers actions ──────────────────────────────────────

  const handleEdit = (entreprise: Enterprise) => {
    setEditingEnterprise(entreprise);
    setEditForm({
      name: entreprise.name,
      email: entreprise.email,
      phone: entreprise.phone ?? '',
      location: entreprise.location ?? '',
      adminFirstName: entreprise.adminFirstName,
      adminLastName: entreprise.adminLastName,
      subscription: entreprise.subscription,
      logo: entreprise.logo ?? '',
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnterprise) return;
    try {
      setEditing(true);
      setEditError(null);
      await updateEnterprise(editingEnterprise.id, editForm);
      setShowEditModal(false);
      setToast({ message: `${editingEnterprise.name} à été modifier avec succès.`, variant: 'success' });
      await fetchEnterprises();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la modification', variant: 'error' });
    } finally {
      setEditing(false);
    }
  };


  const handleToggleStatus = async (entreprise: Enterprise) => {
    try {
      setActionLoading(entreprise.id);
      const newStatus = entreprise.status === 'active' ? 'suspended' : 'active';
      await updateEnterprise(entreprise.id, { status: newStatus });
      setToast({ message: `${newStatus === 'active' ? 'Entreprise activée' : 'Entreprise suspendue'}`, variant: 'success' });
      await fetchEnterprises();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors du changement de status', variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (entreprise: Enterprise) => {
    setDeletingEnterprise(entreprise);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEnterprise) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteEnterprise(deletingEnterprise.id);
      setShowDeleteModal(false);
      setToast({ message: `${deletingEnterprise.name} à été supprimé avec succès.`, variant: 'success' });
      setDeletingEnterprise(null);
      await fetchEnterprises();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la suppression', variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Entreprise',
      render: (enterprise: Enterprise) => (
        <div className="flex items-center gap-3">
          <Avatar src={enterprise.logo} name={enterprise.name} size="md" shape="rounded" />
          <div>
            <p className="font-medium text-dark">{enterprise.name}</p>
            <p className="text-sm text-slate">{enterprise.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'subscription',
      header: 'Abonnement',
      render: (enterprise: Enterprise) => (
        <Badge
          variant={
            enterprise.subscription === 'Enterprise' ? 'platinum'
              : enterprise.subscription === 'Pro' ? 'gold' : 'silver'
          }
        >
          {enterprise.subscription}
        </Badge>
      ),
    },
    {
      key: 'cardsCount',
      header: 'Cartes',
      render: (enterprise: Enterprise) => (
        <span className="font-medium">{(enterprise.cardsCount ?? 0).toLocaleString('fr-FR')}</span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'status',
      header: 'Statut',
      render: (enterprise: Enterprise) => (
        <Badge variant={enterprise.status === 'active' ? 'active' : 'inactive'}>
          {enterprise.status === 'active' ? 'Actif' : 'Suspendu'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (entreprise: Enterprise) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(entreprise); }}
            disabled={actionLoading === entreprise.id}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(entreprise); }}
            disabled={actionLoading === entreprise.id}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${entreprise.status
              ? 'text-warning hover:bg-warning/10'
              : 'text-green-600 hover:bg-green-50'
              }`}
            title={entreprise.status ? 'Désactiver' : 'Activer'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(entreprise); }}
            disabled={actionLoading === entreprise.id}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Entreprises</h1>
          <p className="text-slate mt-1">
            {loading ? 'Chargement...' : `${allEnterprises.length} entreprise${allEnterprises.length > 1 ? 's' : ''} au total`}
          </p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={handleOpenCreate}>
          Nouvelle entreprise
        </Button>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher par nom, email, ville..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
        ) : paginated.length === 0 ? (
          <div className="p-8 text-center text-slate">
            {search || statusFilter !== 'all' ? 'Aucun résultat pour ces filtres' : 'Aucune entreprise'}
          </div>
        ) : (
          <>
            <Table
              data={paginated}
              columns={columns}
              onRowClick={(enterprise) => navigate(`/admin/enterprises/${enterprise.id}`)}
            />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                {(search || statusFilter !== 'all') && ` · ${allEnterprises.length} au total`}
              </p>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="px-3 py-2 text-sm text-slate">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Modale création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle entreprise"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{formError}</div>
          )}

          {/* Logo upload */}
          <LogoUpload
            label="Logo de l'entreprise"
            value={form.logo}
            onChange={(url) => handleFieldChange('logo', url)}
            onFileSelect={(file) => setLogoFile(file)}
            previewName={form.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nom de l'entreprise *"
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Conciergerie Premium"
              />
              {touched.name && fieldErrors.name && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <Input
                label="Email *"
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="contact@entreprise.fr"
              />
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                label="Téléphone"
                value={form.phone}
                onChange={(val) => handleFieldChange('phone', val)}
              />
            </div>
            <Input
              label="Localisation"
              value={form.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Paris, France"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prénom de l'admin"
              value={form.adminFirstName}
              onChange={(e) => handleFieldChange('adminFirstName', e.target.value)}
              placeholder="Jean"
            />
            <Input
              label="Nom de l'admin"
              value={form.adminLastName}
              onChange={(e) => handleFieldChange('adminLastName', e.target.value)}
              placeholder="Dupont"
            />
          </div>

          <Select
            label="Plan d'abonnement"
            options={SUBSCRIPTION_OPTIONS}
            value={form.subscription}
            onChange={(val) => handleFieldChange('subscription', val)}
          />

          <div className="rounded-2xl border border-slate/20 bg-cloud/70 p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cardOptions.enabled}
                onChange={(e) => setCardOptions((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate/30 text-primary focus:ring-primary"
              />
              <span className="text-sm font-semibold text-dark">Générer des cartes NFC pour cette entreprise</span>
            </label>

            {cardOptions.enabled && (
              <div className="space-y-4 pl-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Type de carte"
                    options={CARD_TYPE_OPTIONS}
                    value={cardOptions.type}
                    onChange={(value) => setCardOptions((prev) => ({ ...prev, type: value as CardType, subtype: '' }))}
                    placeholder="Sélectionner un type"
                  />
                  {cardOptions.type === 'Restaurant' ? (
                    <Select
                      label="Sous-type"
                      options={CARD_SUBTYPE_OPTIONS}
                      value={cardOptions.subtype}
                      onChange={(value) => setCardOptions((prev) => ({ ...prev, subtype: value }))}
                      placeholder="Sous-type"
                    />
                  ) : (
                    <div />
                  )}
                </div>

                <Input
                  label="URL de base du scan (optionnel)"
                  icon={<Link className="w-4 h-4 text-slate" />}
                  value={cardOptions.scanBaseUrl}
                  onChange={(e) => setCardOptions((prev) => ({ ...prev, scanBaseUrl: e.target.value }))}
                  placeholder="Laissez vide pour utiliser la config du serveur"
                />
                <p className="text-xs text-slate -mt-2">
                  Si vide, l'URL configurée dans le backend sera utilisée (SCAN_BASE_URL)
                </p>
                <Input
                  label="Quantité"
                  type="number"
                  value={cardOptions.quantity}
                  onChange={(e) => setCardOptions((prev) => ({ ...prev, quantity: e.target.value }))}
                  min={1}
                  max={1000}
                />
                <div className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-xs text-slate">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Les cartes seront créées immédiatement après l’ajout de l’entreprise.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button type="submit" fullWidth disabled={creating || !isFormValid} title={!isFormValid ? 'Remplissez les champs obligatoires' : undefined}>
              {creating ? 'Création...' : "Créer l'entreprise"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modale mot de passe généré */}
      <Modal
        isOpen={!!generatedPassword}
        onClose={() => setGeneratedPassword(null)}
        title="Entreprise créée avec succès"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate">
            Voici le mot de passe de connexion généré pour cette entreprise.
            <strong className="text-dark"> Copiez-le maintenant</strong>, il ne sera plus affiché.
          </p>
          <div className="flex items-center gap-2 p-3 bg-cloud rounded-xl border border-slate/20">
            <code className="flex-1 text-sm font-mono text-dark tracking-widest select-all">
              {generatedPassword}
            </code>
            <button
              type="button"
              onClick={handleCopyPassword}
              className="p-2 rounded-lg hover:bg-primary/10 text-slate hover:text-primary transition-colors flex-shrink-0"
              title="Copier"
            >
              {passwordCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate">
            L'entreprise devra changer ce mot de passe à sa première connexion.
          </p>
          <Button fullWidth onClick={() => setGeneratedPassword(null)}>
            J'ai copié le mot de passe
          </Button>
        </div>
      </Modal>

      {/* Modale édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'entreprise"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
          {editError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{editError}</div>
          )}

          <LogoUpload
            label="Logo de l'entreprise"
            value={editForm.logo ?? ''}
            onChange={(url) => setEditForm((prev) => ({ ...prev, logo: url }))}
            onFileSelect={async (file) => {
              if (!file) return;
              try {
                const url = await uploadLogo(file);
                setEditForm((prev) => ({ ...prev, logo: url }));
              } catch {
                setEditError("Erreur lors de l'upload du logo");
              }
            }}
            previewName={editForm.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom de l'entreprise *"
              value={editForm.name ?? ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Conciergerie Premium"
            />
            <Input
              label="Email *"
              type="email"
              value={editForm.email ?? ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="contact@entreprise.fr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PhoneInput
              label="Téléphone"
              value={editForm.phone ?? ''}
              onChange={(val) => setEditForm((prev) => ({ ...prev, phone: val }))}
            />
            <Input
              label="Localisation"
              value={editForm.location ?? ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Paris, France"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prénom de l'admin"
              value={editForm.adminFirstName ?? ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, adminFirstName: e.target.value }))}
              placeholder="Jean"
            />
            <Input
              label="Nom de l'admin"
              value={editForm.adminLastName ?? ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, adminLastName: e.target.value }))}
              placeholder="Dupont"
            />
          </div>

          <Select
            label="Plan d'abonnement"
            options={SUBSCRIPTION_OPTIONS}
            value={editForm.subscription ?? 'Starter'}
            onChange={(val) => setEditForm((prev) => ({ ...prev, subscription: val as CreateEnterpriseForm['subscription'] }))}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button type="submit" fullWidth disabled={editing || !editForm.name?.trim() || !editForm.email?.trim()}>
              {editing ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modale confirmation suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'entreprise"
        size="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{deleteError}</div>
          )}
          <p className="text-sm text-slate">
            Vous êtes sur le point de supprimer{' '}
            <strong className="text-dark">{deletingEnterprise?.name}</strong>.
            Cette action supprimera toutes les données liées (cartes, clients, scans) et est{' '}
            <strong className="text-red-600">irréversible</strong>.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnterprisesPage;
