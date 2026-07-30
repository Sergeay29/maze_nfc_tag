import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Plus, User, Power, Trash2 } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Pagination, Avatar, Modal, Input, PhoneInput, Toast } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient, updateClient } from '../../api/enterpriseApi';
import type { ClientData } from '../../api/enterpriseApi';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { deleteClient } from '../../api/enterpriseApi';

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

  //Toast_____________
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── États modale édition ──────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingCLient] = useState<ClientData | null>(null);
  const [editForm, setEditForm] = useState<Partial<ClientData>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // ── États modale confirmation suppression ─────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState<ClientData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      setToast({ message: `Client "${form.name.trim()}" créé avec succès !`, variant: 'success' });
      fetchClients();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la création');
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la création', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers actions ──────────────────────────────────────

  const handleEdit = (client: ClientData) => {
    setEditingCLient(client);
    setEditForm({
      name: client.name,
      email: client.email,
      phone: client.phone ?? '',
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      setEditing(true);
      setEditError(null);
      await updateClient(editingClient.id, editForm);
      setShowEditModal(false);
      setToast({ message: `${editingClient.name} à été modifier avec succès.`, variant: 'success' });
      await fetchClients();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la modification', variant: 'error' });
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (entreprise: ClientData) => {
    try {
      setActionLoading(entreprise.id);
      const newStatus = entreprise.status === 'active' ? 'suspended' : 'active';
      await updateClient(entreprise.id, { status: newStatus });
      setToast({ message: `${newStatus === 'active' ? 'Client activé' : 'Client désactivé'}`, variant: 'success' });
      await fetchClients();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors du changement de status', variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (client: ClientData) => {
    setDeletingClient(client);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteClient(deletingClient.id);
      setShowDeleteModal(false);
      setToast({ message: `${deletingClient.name} à été supprimé avec succès.`, variant: 'success' });
      setDeletingClient(null);
      await fetchClients();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la suppression', variant: 'error' });
    } finally {
      setDeleting(false);
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
    {
      key: 'actions',
      header: 'Actions',
      render: (client: ClientData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
            disabled={actionLoading === client.id}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(client); }}
            disabled={actionLoading === client.id}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${client.status
              ? 'text-warning hover:bg-warning/10'
              : 'text-green-600 hover:bg-green-50'
              }`}
            title={client.status ? 'Désactiver' : 'Activer'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(client); }}
            disabled={actionLoading === client.id}
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
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
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

      {/* Modale édition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le client"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
          {editError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{editError}</div>
          )}


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom du client *"
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
          </div>
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
        title="Supprimer le client"
        size="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{deleteError}</div>
          )}
          <p className="text-sm text-slate">
            Vous êtes sur le point de supprimer{' '}
            <strong className="text-dark">{deletingClient?.name}</strong>.
            Cette action supprimera toutes les données liées (point, scans) et est{' '}
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

export default ClientsPage;
