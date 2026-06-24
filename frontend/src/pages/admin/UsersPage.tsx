import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, Badge, SearchInput, Table } from '../../components';
import { getUsers } from '../../api/adminApi';
import type { AdminUser } from '../../api/adminApi';

const ROLE_VARIANT: Record<string, 'platinum' | 'primary' | 'active' | 'warning' | 'inactive'> = {
  SUPER_ADMIN: 'platinum',
  OWNER: 'gold' as unknown as 'platinum',
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUsers({ page, limit, search });
        setUsers(result.data);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, search]);

  const columns = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          </div>
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
      render: (user: AdminUser) => (
        <span className="text-slate text-sm">{user.email}</span>
      ),
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
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Utilisateurs</h1>
          <p className="text-slate mt-1">Tous les utilisateurs de la plateforme</p>
        </div>
        {/* Bouton d'invitation — fonctionnalité future */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-3 bg-cloud text-slate rounded-xl cursor-not-allowed text-sm font-medium"
          title="Bientôt disponible"
        >
          <UserPlus className="w-4 h-4" />
          Inviter un utilisateur
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <SearchInput
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate">Aucun utilisateur trouvé</div>
        ) : (
          <>
            <Table data={users} columns={columns} />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {users.length} sur {total} utilisateur{total > 1 ? 's' : ''}
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
    </div>
  );
};

export default UsersPage;
