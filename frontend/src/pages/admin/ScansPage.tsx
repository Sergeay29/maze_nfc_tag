import React, { useState, useEffect } from 'react';
import { Filter, Clock } from 'lucide-react';
import { Badge, Table, SearchInput, Card } from '../../components';
import { getScans } from '../../api/adminApi';
import type { Scan } from '../../data/mockData';

const ScansPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getScans({
          page,
          limit,
          search,
        });
        setScans(result.data);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        console.error('Error fetching scans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [page, search]);

  const columns = [
    {
      key: 'clientName',
      header: 'Client',
      render: (scan: Scan) => (
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
      render: (scan: Scan) => (
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
      render: (scan: Scan) => {
        let variant: 'success' | 'error' | 'primary' = 'primary';
        if (scan.points > 0) variant = 'success';
        if (scan.points < 0) variant = 'error';
        return <Badge variant={variant}>{scan.action}</Badge>;
      },
    },
    {
      key: 'timestamp',
      header: 'Heure',
      render: (scan: Scan) => (
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

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

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
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate">Chargement...</div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center text-slate">Aucun scan trouvé</div>
        ) : (
          <>
            <Table data={scans} columns={columns} />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                Affichage 1 à {scans.length} sur {total}
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

export default ScansPage;
