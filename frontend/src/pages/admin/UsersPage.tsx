import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit2, Trash2, Power, Key } from 'lucide-react';
import { Card, Badge, SearchInput, Table, Avatar } from '../../components';
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

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      await deleteUser(user.id);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const action = user.isActive ? 'désactiver' : 'activer';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      await toggleUserStatus(user.id);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(user.id);
      const result = await resetUserPassword(user.id);
      alert(
        `Mot de passe réinitialisé avec succès !\n\nNouveau mot de passe : ${result.newPassword}\n\nVeuillez le copier et le transmettre à l'utilisateur de manière sécurisée.`
      );
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setActionLoading(null);
    }
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
          onSuccess={fetchUsers}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UsersPage;
