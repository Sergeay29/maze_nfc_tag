import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Pagination } from '../../components';
import { clients } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const ClientsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  );

  const clientsPerPage = 10;
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * clientsPerPage,
    currentPage * clientsPerPage
  );

  const columns = [
    {
      key: 'name',
      header: 'Client',
      render: (client: typeof clients[0]) => (
        <div className="flex items-center gap-3">
          <img
            src={client.photo}
            alt={client.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-dark">{client.name}</p>
            <p className="text-sm text-slate">{client.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cardNumber',
      header: 'Carte',
      render: (client: typeof clients[0]) => (
        <span className="font-mono text-primary text-sm">{client.cardNumber}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'points',
      header: 'Points',
      render: (client: typeof clients[0]) => (
        <span className="font-semibold text-dark">{client.points.toLocaleString()}</span>
      ),
    },
    {
      key: 'level',
      header: 'Niveau',
      render: (client: typeof clients[0]) => (
        <Badge variant={client.level === 'Platinum' ? 'platinum' : client.level === 'Gold' ? 'gold' : 'silver'}>
          {client.level}
        </Badge>
      ),
    },
    {
      key: 'lastActivity',
      header: 'Dernière activité',
      render: (client: typeof clients[0]) => (
        <span className="text-slate">{new Date(client.lastActivity).toLocaleDateString('fr-FR')}</span>
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
        <Button icon={<Plus className="w-5 h-5" />}>
          Nouveau client
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <SearchInput
            placeholder="Rechercher un client..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <Table
          data={paginatedClients}
          columns={columns}
          onRowClick={(client) => navigate(`/enterprise/clients/${client.id}`)}
        />
        <div className="p-4 border-t border-slate/10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>
    </div>
  );
};

export default ClientsPage;
