import React, { useState } from 'react';
import { Filter, Clock } from 'lucide-react';
import { Badge, Table, SearchInput, Card } from '../../components';
import { scans } from '../../data/mockData';

const ScansPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.clientName.toLowerCase().includes(search.toLowerCase()) ||
      scan.cardNumber.toLowerCase().includes(search.toLowerCase()) ||
      scan.enterpriseName.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || scan.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const columns = [
    {
      key: 'client',
      header: 'Client',
      render: (scan: typeof scans[0]) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {scan.clientName.charAt(0)}
            </span>
          </div>
          <span className="font-medium">{scan.clientName}</span>
        </div>
      ),
    },
    {
      key: 'cardNumber',
      header: 'Carte',
      render: (scan: typeof scans[0]) => (
        <span className="font-mono text-primary">{scan.cardNumber}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'enterpriseName',
      header: 'Entreprise',
      className: 'hidden sm:table-cell',
    },
    {
      key: 'action',
      header: 'Action',
      render: (scan: typeof scans[0]) => {
        let variant: 'success' | 'error' | 'primary' = 'primary';
        if (scan.points > 0) variant = 'success';
        if (scan.points < 0) variant = 'error';
        return (
          <Badge variant={variant}>
            {scan.action}
          </Badge>
        );
      },
    },
    {
      key: 'timestamp',
      header: 'Heure',
      render: (scan: typeof scans[0]) => (
        <div className="flex items-center gap-2 text-slate">
          <Clock className="w-4 h-4" />
          <span>
            {new Date(scan.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Scans</h1>
        <p className="text-slate mt-1">Suivi des scans en temps réel</p>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher un client, carte ou entreprise..."
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
              >
                <option value="all">Toutes les actions</option>
                <option value="Consultation">Consultation</option>
                <option value="+50 points">+50 points</option>
                <option value="+100 points">+100 points</option>
                <option value="Retrait">Retrait points</option>
              </select>
            </div>
          </div>
        </div>
        <Table data={filteredScans} columns={columns} />
      </Card>
    </div>
  );
};

export default ScansPage;
