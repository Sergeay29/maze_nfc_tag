import React from 'react';
import { Clock } from 'lucide-react';
import { Card, Badge, Table } from '../../components';
import { scans } from '../../data/mockData';

const EnterpriseScansPage: React.FC = () => {
  const enterpriseScans = scans.filter(s => s.enterpriseId === '1');

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
    },
    {
      key: 'action',
      header: 'Action',
      render: (scan: typeof scans[0]) => (
        <Badge variant={scan.points > 0 ? 'success' : scan.points < 0 ? 'error' : 'primary'}>
          {scan.action}
        </Badge>
      ),
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
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Scans</h1>
        <p className="text-slate mt-1">Historique des scans</p>
      </div>

      <Card padding="none">
        <Table data={enterpriseScans} columns={columns} />
      </Card>
    </div>
  );
};

export default EnterpriseScansPage;
