import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, Badge, SearchInput, Table, Avatar } from '../../components';
import { getUsers } from '../../api/adminApi';
import type { AdminUser } from '../../api/adminApi';

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

  useEffect(() => {
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
    fetchUsers();
  }, []);

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

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  const columns = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            size="md"
            shape="circle"
          />
          <div>
            <p className="font-medium text-dark">{user.firstName} {user.lastName}</p>
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
          <p className="text-slate mt-1">
            {loading ? 'Chargement...' : `${allUsers.length} utilisateur${allUsers.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-3 bg-cloud text-slate rounded-xl cursor-not-allowed text-sm font-medium"
          title="Bientôt disponible"
        >
          <UserPlus className="w-4 h-4" />
          Inviter un utilisateur
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
          <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
        ) : paginated.length === 0 ? (
          <div className="p-8 text-center text-slate">
            {search ? 'Aucun résultat' : 'Aucun utilisateur'}
          </div>
        ) : (
          <>
            <Table data={paginated} columns={columns} />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                {search && ` · ${allUsers.length} au total`}
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
    </div>
  );
};

export default UsersPage;
