import React, { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Modal, Input, Select } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getEnterprises, createEnterprise } from '../../api/adminApi';
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
}

const EMPTY_FORM: CreateEnterpriseForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  adminFirstName: '',
  adminLastName: '',
  subscription: 'Starter',
};

const EnterprisesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const navigate = useNavigate();

  // Modale création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateEnterpriseForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEnterprises({ page, limit, search, status: filter });
      setEnterprises(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, filter]);

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Le nom et l\'email sont obligatoires.');
      return;
    }
    try {
      setCreating(true);
      setFormError(null);
      await createEnterprise(form);
      setShowCreateModal(false);
      setPage(1);
      await fetchEnterprises();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleFieldChange = (field: keyof CreateEnterpriseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Entreprise',
      render: (enterprise: Enterprise) => (
        <div className="flex items-center gap-3">
          {enterprise.logo ? (
            <img
              src={enterprise.logo}
              alt={enterprise.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {enterprise.name.charAt(0)}
              </span>
            </div>
          )}
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
            enterprise.subscription === 'Enterprise'
              ? 'platinum'
              : enterprise.subscription === 'Pro'
              ? 'gold'
              : 'silver'
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
        <span className="font-medium">{enterprise.cardsCount.toLocaleString('fr-FR')}</span>
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
          <p className="text-slate mt-1">Gérez les entreprises clientes</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={handleOpenCreate}>
          Nouvelle entreprise
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher une entreprise..."
                value={search}
                onChange={(val) => { setSearch(val); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as typeof filter);
                  setPage(1);
                }}
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
        ) : enterprises.length === 0 ? (
          <div className="p-8 text-center text-slate">Aucune entreprise trouvée</div>
        ) : (
          <>
            <Table
              data={enterprises}
              columns={columns}
              onRowClick={(enterprise) =>
                navigate(`/admin/enterprises/${enterprise.id}`)
              }
            />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {enterprises.length} sur {total} entreprise{total > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modale création entreprise */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle entreprise"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom de l'entreprise *"
              value={form.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Conciergerie Premium"
            />
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="contact@entreprise.fr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              value={form.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
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

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" fullWidth disabled={creating}>
              {creating ? 'Création...' : 'Créer l\'entreprise'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnterprisesPage;
