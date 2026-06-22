import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card } from '../../components';
import { enterprises } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const EnterprisesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const navigate = useNavigate();

  const filteredEnterprises = enterprises.filter((enterprise) => {
    const matchesSearch = enterprise.name.toLowerCase().includes(search.toLowerCase()) ||
      enterprise.admin.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || enterprise.status === filter;
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      key: 'name',
      header: 'Entreprise',
      render: (enterprise: typeof enterprises[0]) => (
        <div className="flex items-center gap-3">
          <img
            src={enterprise.logo}
            alt={enterprise.name}
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <p className="font-medium text-dark">{enterprise.name}</p>
            <p className="text-sm text-slate">{enterprise.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      className: 'hidden md:table-cell',
    },
    {
      key: 'subscription',
      header: 'Abonnement',
      render: (enterprise: typeof enterprises[0]) => (
        <Badge variant={enterprise.subscription === 'Enterprise' ? 'platinum' : enterprise.subscription === 'Pro' ? 'gold' : 'silver'}>
          {enterprise.subscription}
        </Badge>
      ),
    },
    {
      key: 'cardsCount',
      header: 'Cartes',
      render: (enterprise: typeof enterprises[0]) => (
        <span className="font-medium">{enterprise.cardsCount.toLocaleString()}</span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'status',
      header: 'Statut',
      render: (enterprise: typeof enterprises[0]) => (
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
        <Button icon={<Plus className="w-5 h-5" />}>
          Nouvelle entreprise
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher une entreprise..."
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </div>
        <Table
          data={filteredEnterprises}
          columns={columns}
          onRowClick={(enterprise) => navigate(`/admin/enterprises/${enterprise.id}`)}
        />
      </Card>
    </div>
  );
};

export default EnterprisesPage;
