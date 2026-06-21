import React from 'react';
import { Card, Badge } from '../../components';

const users = [
  { id: '1', name: 'Admin Principal', email: 'admin@mazenfc.com', role: 'Super Admin', status: 'active', lastLogin: '2024-03-15' },
  { id: '2', name: 'Marie Dupont', email: 'marie@conciergerie.fr', role: 'Admin Entreprise', status: 'active', lastLogin: '2024-03-15' },
  { id: '3', name: 'Jean Martin', email: 'jean@autospa.fr', role: 'Admin Entreprise', status: 'active', lastLogin: '2024-03-14' },
  { id: '4', name: 'Sophie Bernard', email: 'sophie@riviera.com', role: 'Admin Entreprise', status: 'inactive', lastLogin: '2024-03-10' },
  { id: '5', name: 'Pierre Leroy', email: 'pierre@gastro.fr', role: 'Admin Entreprise', status: 'suspended', lastLogin: '2024-02-28' },
];

const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Utilisateurs</h1>
        <p className="text-slate mt-1">Gérez les utilisateurs de la plateforme</p>
      </div>

      <Card padding="none">
        <table className="w-full">
          <thead className="bg-cloud border-b border-slate/10">
            <tr>
              <th className="table-header px-6 py-4">Utilisateur</th>
              <th className="table-header px-6 py-4 hidden md:table-cell">Email</th>
              <th className="table-header px-6 py-4">Rôle</th>
              <th className="table-header px-6 py-4 hidden sm:table-cell">Statut</th>
              <th className="table-header px-6 py-4 hidden lg:table-cell">Dernière connexion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-cloud transition-colors duration-200">
                <td className="table-cell px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient flex items-center justify-center">
                      <span className="text-white font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="table-cell px-6 hidden md:table-cell text-slate">{user.email}</td>
                <td className="table-cell px-6">
                  <Badge variant={user.role === 'Super Admin' ? 'platinum' : 'primary'}>
                    {user.role}
                  </Badge>
                </td>
                <td className="table-cell px-6 hidden sm:table-cell">
                  <Badge variant={user.status === 'active' ? 'active' : user.status === 'inactive' ? 'warning' : 'inactive'}>
                    {user.status === 'active' ? 'Actif' : user.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                  </Badge>
                </td>
                <td className="table-cell px-6 hidden lg:table-cell text-slate">
                  {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default UsersPage;
