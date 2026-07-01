import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Modal, Input, Select, PhoneInput, Avatar, LogoUpload } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getEnterprises, createEnterprise } from '../../api/adminApi';
import { isValidPhoneNumber } from 'react-phone-number-input';
import type { Enterprise } from '../../data/mockData';

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
  subscription: string;
  logo: string;
  ownerPassword: string;
  ownerPasswordConfirm: string;
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
  ownerPassword: '',
  ownerPasswordConfirm: '',
};

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
  const [touched, setTouched] = useState<Partial<Record<keyof CreateEnterpriseForm, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ── Validation par champ ──────────────────────────────────
  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof CreateEnterpriseForm, string>> = {};
    if (!form.name.trim()) errors.name = 'Le nom est obligatoire';
    if (!form.email.trim()) {
      errors.email = "L'email est obligatoire";
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Email invalide';
    }
    if (form.phone && !isValidPhoneNumber(form.phone)) {
      errors.phone = 'Numéro invalide';
    }
    if (form.logo && !/^https?:\/\/.+/.test(form.logo.trim())) {
      errors.logo = 'Doit être une URL valide (http/https)';
    }
    if (!form.ownerPassword) {
      errors.ownerPassword = 'Le mot de passe est obligatoire';
    } else if (form.ownerPassword.length < 8) {
      errors.ownerPassword = 'Minimum 8 caractères';
    }
    if (!form.ownerPasswordConfirm) {
      errors.ownerPasswordConfirm = 'Confirmez le mot de passe';
    } else if (form.ownerPassword !== form.ownerPasswordConfirm) {
      errors.ownerPasswordConfirm = 'Les mots de passe ne correspondent pas';
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
    // Marquer tous les champs comme touchés pour afficher les erreurs
    setTouched({ name: true, email: true, phone: true, logo: true, ownerPassword: true, ownerPasswordConfirm: true });
    if (!isFormValid) return;

    try {
      setCreating(true);
      setFormError(null);
      await createEnterprise({
        ...form,
        logo: form.logo.trim() || undefined,
        ownerPassword: form.ownerPassword,
      } as Parameters<typeof createEnterprise>[0]);
      setShowCreateModal(false);
      await fetchEnterprises();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  // Aperçu logo en temps réel dans la modale
  const logoPreview = form.logo && /^https?:\/\/.+/.test(form.logo.trim()) ? form.logo.trim() : null;

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
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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

          {/* ── Compte de connexion ── */}
          <div className="pt-2 border-t border-slate/10">
            <p className="text-sm font-medium text-dark mb-3">
              Compte de connexion de l'entreprise
            </p>
            <p className="text-xs text-slate mb-4">
              L'entreprise utilisera l'email ci-dessus et ce mot de passe pour se connecter à la plateforme.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Mot de passe *"
                  type="password"
                  value={form.ownerPassword}
                  onChange={(e) => handleFieldChange('ownerPassword', e.target.value)}
                  onBlur={() => handleBlur('ownerPassword')}
                  placeholder="Minimum 8 caractères"
                />
                {touched.ownerPassword && fieldErrors.ownerPassword && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.ownerPassword}</p>
                )}
              </div>
              <div>
                <Input
                  label="Confirmer le mot de passe *"
                  type="password"
                  value={form.ownerPasswordConfirm}
                  onChange={(e) => handleFieldChange('ownerPasswordConfirm', e.target.value)}
                  onBlur={() => handleBlur('ownerPasswordConfirm')}
                  placeholder="Répéter le mot de passe"
                />
                {touched.ownerPasswordConfirm && fieldErrors.ownerPasswordConfirm && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.ownerPasswordConfirm}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            {/* Bouton désactivé si le formulaire est invalide */}
            <Button
              type="submit"
              fullWidth
              disabled={creating || !isFormValid}
              title={!isFormValid ? 'Remplissez les champs obligatoires' : undefined}
            >
              {creating ? 'Création...' : "Créer l'entreprise"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnterprisesPage;
