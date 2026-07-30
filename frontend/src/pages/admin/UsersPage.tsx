import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit2, Trash2, Power, Key } from 'lucide-react';
import { Card, Badge, SearchInput, Table, Avatar, Modal, Button, Toast } from '../../components';
import { getUsers, deleteUser, toggleUserStatus, resetUserPassword, type AdminUser } from '../../api/adminApi';
import CreateUserModal from '../../components/modals/CreateUserModal';
import EditUserModal from '../../components/modals/EditUserModal';

const PAGE_SIZE = 15;

const ROLE_VARIANT: Record<string, 'platinum' | 'primary' | 'active' | 'warning' | 'inactive'> = {
  SUPER_ADMIN: 'platinum',
  OWNER: 'warning',
  MANAGER: 'primary',
  EMPLOYEE: 'active',
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Propriétaire',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employé',
};

const UsersPage: React.FC = () => {
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Toast ────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  // ── Confirm modals ───────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel: string;
    variant: 'danger' | 'warning';
  } | null>(null);

  // ── Reset password result modal ──────────────────────────
  const [newPasswordModal, setNewPasswordModal] = useState<{ name: string; password: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUsers({ page: 1, limit: 500 });
      setAllUsers(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.trim().toLowerCase();
    return allUsers.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: AdminUser) => {
    setConfirmModal({
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(user.id);
          setConfirmModal(null);
          await deleteUser(user.id);
          await fetchUsers();
          setToast({ message: `${user.firstName} ${user.lastName} supprimé avec succès.`, variant: 'success' });
        } catch (err) {
          setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la suppression', variant: 'error' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleToggleStatus = (user: AdminUser) => {
    const action = user.isActive ? 'désactiver' : 'activer';
    setConfirmModal({
      title: user.isActive ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir ${action} ${user.firstName} ${user.lastName} ?`,
      confirmLabel: user.isActive ? 'Désactiver' : 'Activer',
      variant: user.isActive ? 'warning' : 'warning',
      onConfirm: async () => {
        try {
          setActionLoading(user.id);
          setConfirmModal(null);
          await toggleUserStatus(user.id);
          await fetchUsers();
          setToast({
            message: `${user.firstName} ${user.lastName} ${user.isActive ? 'désactivé' : 'activé'} avec succès.`,
            variant: 'success',
          });
        } catch (err) {
          setToast({ message: err instanceof Error ? err.message : 'Erreur lors du changement de statut', variant: 'error' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleResetPassword = (user: AdminUser) => {
    setConfirmModal({
      title: 'Réinitialiser le mot de passe',
      message: `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`,
      confirmLabel: 'Réinitialiser',
      variant: 'warning',
      onConfirm: async () => {
        try {
          setActionLoading(user.id);
          setConfirmModal(null);
          const result = await resetUserPassword(user.id);
          setNewPasswordModal({ name: `${user.firstName} ${user.lastName}`, password: result.newPassword });
          await fetchUsers();
        } catch (err) {
          setToast({ message: err instanceof Error ? err.message : 'Erreur lors de la réinitialisation', variant: 'error' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="md" shape="circle" />
          <div>
            <p className="font-medium text-dark">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate hidden md:block">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: AdminUser) => <span className="text-slate text-sm">{user.email}</span>,
      className: 'hidden md:table-cell',
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (user: AdminUser) => {
        const roleName = user.Role?.name ?? 'Inconnu';
        return (
          <Badge variant={ROLE_VARIANT[roleName] ?? 'primary'}>
            {ROLE_LABEL[roleName] ?? roleName}
          </Badge>
        );
      },
    },
    {
      key: 'enterprise',
      header: 'Entreprise',
      render: (user: AdminUser) => (
        <span className="text-slate text-sm">{user.enterprise?.name ?? '-'}</span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'status',
      header: 'Statut',
      render: (user: AdminUser) => (
        <Badge variant={user.isActive ? 'active' : 'inactive'}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'createdAt',
      header: 'Inscrit le',
      render: (user: AdminUser) => (
        <span className="text-slate text-sm">
          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
      className: 'hidden xl:table-cell',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(user)}
            disabled={actionLoading === user.id}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(user)}
            disabled={actionLoading === user.id}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${user.isActive
                ? 'text-warning hover:bg-warning/10'
                : 'text-green-600 hover:bg-green-50'
              }`}
            title={user.isActive ? 'Désactiver' : 'Activer'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleResetPassword(user)}
            disabled={actionLoading === user.id}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Réinitialiser le mot de passe"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(user)}
            disabled={actionLoading === user.id}
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
          <h1 className="text-2xl font-bold font-poppins text-dark">Utilisateurs</h1>
          <p className="text-slate mt-1">
            {loading ? 'Chargement...' : `${allUsers.length} utilisateur${allUsers.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Créer un utilisateur
        </button>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <SearchInput
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={paginated}
              emptyMessage="Aucun utilisateur trouvé"
            />
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate/10 flex items-center justify-between">
                <p className="text-sm text-slate">
                  Page {page} sur {totalPages} · {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors text-sm font-medium disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors text-sm font-medium disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsers}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchUsers();
            setToast({ message: 'Utilisateur mis à jour avec succès.', variant: 'success' });
          }}
          user={selectedUser}
        />
      )}

      {/* Modale confirmation générique */}
      {confirmModal && (
        <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal.title} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate">{confirmModal.message}</p>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={() => setConfirmModal(null)}>
                Annuler
              </Button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors text-white ${confirmModal.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-warning hover:bg-yellow-500'
                  }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale affichage nouveau mot de passe */}
      {newPasswordModal && (
        <Modal isOpen={!!newPasswordModal} onClose={() => setNewPasswordModal(null)} title="Mot de passe réinitialisé" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate">
              Nouveau mot de passe pour <strong className="text-dark">{newPasswordModal.name}</strong>.
              Copiez-le et transmettez-le de manière sécurisée.
            </p>
            <div className="flex items-center gap-2 p-3 bg-cloud rounded-xl border border-slate/20">
              <code className="flex-1 text-sm font-mono text-dark tracking-widest select-all">
                {newPasswordModal.password}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newPasswordModal.password);
                  setPasswordCopied(true);
                  setTimeout(() => setPasswordCopied(false), 2000);
                }}
                className="p-2 rounded-lg hover:bg-primary/10 text-slate hover:text-primary transition-colors"
                title="Copier"
              >
                {passwordCopied ? '✓' : '⎘'}
              </button>
            </div>
            <Button fullWidth onClick={() => setNewPasswordModal(null)}>J'ai copié le mot de passe</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
