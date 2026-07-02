import React, { useState, useEffect, useCallback } from 'react';
import { Plus, User } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Pagination, Avatar, Modal, Input, PhoneInput } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient } from '../../api/enterpriseApi';
import type { ClientData } from '../../api/enterpriseApi';
import { isValidPhoneNumber } from 'react-phone-number-input';

const CLIENTS_PER_PAGE = 10;

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getClients({ page: currentPage, limit: CLIENTS_PER_PAGE, search: search || undefined });
      setClients(res.data);
      setTotalPages(res.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const phoneError = form.phone && !isValidPhoneNumber(form.phone) ? 'Numéro de téléphone invalide' : undefined;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setSaveError('Le nom est obligatoire'); return; }
    if (phoneError) { setSaveError(phoneError); return; }
    try {
      setSaving(true);
      setSaveError(null);
      await createClient({ name: form.name.trim(), email: form.email || undefined, phone: form.phone || undefined });
      setModalOpen(false);
      setForm({ name: '', email: '', phone: '' });
      fetchClients();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Client',
      render: (client: ClientData) => (
        <div className="flex items-center gap-3">
          <Avatar src={client.photo} name={client.name} size="sm" />
          <div>
            <p className="font-medium text-dark">{client.name}</p>
            <p className="text-sm text-slate">{client.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'points',
      header: 'Points',
      render: (client: ClientData) => (
        <span className="font-semibold text-dark">{client.points.toLocaleString('fr-FR')}</span>
      ),
    },
    {
      key: 'level',
      header: 'Niveau',
      render: (client: ClientData) => (
        <Badge variant={client.level === 'Platinum' ? 'platinum' : client.level === 'Gold' ? 'gold' : 'silver'}>
          {client.level}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (client: ClientData) => (
        <Badge variant={client.status === 'active' ? 'active' : 'inactive'}>
          {client.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'lastActivity',
      header: 'Dernière activité',
      render: (client: ClientData) => (
        <span className="text-slate">
          {client.lastActivity ? new Date(client.lastActivity).toLocaleDateString('fr-FR') : '—'}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Clients</h1>
          <p className="text-slate mt-1">Gérez vos clients et leurs informations</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => { setForm({ name: '', email: '', phone: '' }); setSaveError(null); setModalOpen(true); }}>
          Nouveau client
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <SearchInput placeholder="Rechercher un client..." value={search} onChange={setSearch} />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate">
            <User className="w-10 h-10 opacity-30" />
            <p>{search ? 'Aucun client trouvé pour cette recherche' : 'Aucun client pour le moment'}</p>
          </div>
        ) : (
          <Table
            data={clients}
            columns={columns}
            onRowClick={(client) => navigate(`/enterprise/clients/${client.id}`)}
          />
        )}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate/10">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau client">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{saveError}</div>}
          <Input label="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du client" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
          <PhoneInput
            label="Téléphone"
            value={form.phone}
            onChange={(val) => setForm({ ...form, phone: val })}
            error={phoneError}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)} disabled={saving}>Annuler</Button>
            <Button type="submit" fullWidth disabled={saving || !!phoneError}>{saving ? 'Création...' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientsPage;
