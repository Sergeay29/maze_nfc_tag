import React, { useState, useEffect } from 'react';
import { Clock, QrCode } from 'lucide-react';
import { Card, Badge, Table, Pagination } from '../../components';
import { getEnterpriseScans } from '../../api/enterpriseApi';
import type { ScanData } from '../../api/enterpriseApi';

const SCANS_PER_PAGE = 20;

const EnterpriseScansPage: React.FC = () => {
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getEnterpriseScans({ page: currentPage, limit: SCANS_PER_PAGE });
        setScans(res.data);
        setTotalPages(res.pages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [currentPage]);

  const columns = [
    {
      key: 'client',
      header: 'Client',
      render: (scan: ScanData) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {(scan.Client?.name ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-dark">{scan.Client?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'card',
      header: 'Carte',
      render: (scan: ScanData) => (
        <span className="font-mono text-primary text-sm">{scan.NFCCard?.cardCode ?? '—'}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'service',
      header: 'Service',
      render: (scan: ScanData) => (
        <span className="text-slate text-sm">{scan.Service?.name ?? scan.service?.name ?? '—'}</span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'points',
      header: 'Points',
      render: (scan: ScanData) => (
        <Badge variant={scan.pointsAdded > 0 ? 'success' : scan.pointsAdded < 0 ? 'error' : 'primary'}>
          {scan.pointsAdded > 0 ? `+${scan.pointsAdded}` : scan.pointsAdded === 0 ? 'Consultation' : String(scan.pointsAdded)}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Date / Heure',
      render: (scan: ScanData) => (
        <div className="flex items-center gap-2 text-slate text-sm">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            {new Date(scan.scannedAt).toLocaleDateString('fr-FR')}{' '}
            {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Scans</h1>
        <p className="text-slate mt-1">Historique de tous les scans de vos cartes NFC</p>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate">
            <QrCode className="w-10 h-10 opacity-30" />
            <p>Aucun scan enregistré</p>
          </div>
        ) : (
          <Table data={scans} columns={columns} />
        )}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate/10">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default EnterpriseScansPage;
