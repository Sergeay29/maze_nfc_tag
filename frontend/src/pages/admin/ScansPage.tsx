import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Badge, Table, SearchInput, Card, Avatar } from '../../components';
import { getScans } from '../../api/adminApi';
import type { Scan } from '../../data/mockData';

const PAGE_SIZE = 15;

const ScansPage: React.FC = () => {
  const [allScans, setAllScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getScans({ page: 1, limit: 1000 });
        setAllScans(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allScans;
    const q = search.trim().toLowerCase();
    return allScans.filter(
      (s) =>
        (s.clientName ?? '').toLowerCase().includes(q) ||
        (s.cardNumber ?? '').toLowerCase().includes(q) ||
        (s.enterpriseName ?? '').toLowerCase().includes(q)
    );
  }, [allScans, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  const columns = [
    {
      key: 'clientName',
      header: 'Client',
      render: (scan: Scan) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={scan.clientName ?? '?'}
            size="md"
            shape="circle"
          />
          <span className="font-medium text-dark">{scan.clientName}</span>
        </div>
      ),
    },
    {
      key: 'cardNumber',
      header: 'Carte',
      render: (scan: Scan) => (
        <span className="font-mono text-primary text-sm">{scan.cardNumber ?? '—'}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'enterpriseName',
      header: 'Entreprise',
      render: (scan: Scan) => (
        <span className="text-dark">{scan.enterpriseName ?? '—'}</span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'action',
      header: 'Action',
      render: (scan: Scan) => {
        const variant = scan.points > 0 ? 'active' : scan.points < 0 ? 'inactive' : 'primary';
        return <Badge variant={variant as 'active' | 'inactive' | 'primary'}>{scan.action}</Badge>;
      },
    },
    {
      key: 'timestamp',
      header: 'Heure',
      render: (scan: Scan) => (
        <div className="flex items-center gap-2 text-slate">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {new Date(scan.timestamp).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
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
        <p className="text-slate mt-1">
          {loading ? 'Chargement...' : `${allScans.length} scan${allScans.length > 1 ? 's' : ''} au total`}
        </p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <SearchInput
            placeholder="Rechercher par client, carte ou entreprise..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
        ) : paginated.length === 0 ? (
          <div className="p-8 text-center text-slate">
            {search ? 'Aucun résultat pour cette recherche' : 'Aucun scan'}
          </div>
        ) : (
          <>
            <Table data={paginated} columns={columns} />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                {search && ` · ${allScans.length} au total`}
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

export default ScansPage;
