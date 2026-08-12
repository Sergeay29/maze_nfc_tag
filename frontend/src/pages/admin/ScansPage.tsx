import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Download, Filter, RefreshCw } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  SearchInput,
  Select,
  Table,
  Toast,
} from '../../components';
import {
  exportScansCsv,
  getEnterprises,
  getScans,
} from '../../api/adminApi';
import type {
  AdminScanData,
  GetScansParams,
} from '../../api/adminApi';

const PAGE_SIZE = 15;

const formatScanDate = (value?: string): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ScansPage: React.FC = () => {
  const [scans, setScans] = useState<AdminScanData[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error' | 'info';
  } | null>(null);

  const [search, setSearch] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [enterpriseOptions, setEnterpriseOptions] = useState([
    { value: 'all', label: 'Toutes les entreprises' },
  ]);

  useEffect(() => {
    let active = true;

    getEnterprises({ page: 1, limit: 500 })
      .then((result) => {
        if (!active) return;

        setEnterpriseOptions([
          { value: 'all', label: 'Toutes les entreprises' },
          ...result.data.map((enterprise) => ({
            value: enterprise.id,
            label: enterprise.name,
          })),
        ]);
      })
      .catch(() => {
        // Le filtre entreprise reste simplement limité à "Toutes".
      });

    return () => {
      active = false;
    };
  }, []);

  const filters = useMemo<GetScansParams>(
    () => ({
      search: search.trim() || undefined,
      enterpriseId: enterpriseId !== 'all' ? enterpriseId : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [search, enterpriseId, startDate, endDate],
  );

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getScans({
          ...filters,
          page,
          limit: PAGE_SIZE,
        });

        setScans(result.data);
        setTotal(result.total);
        setPages(Math.max(result.pages, 1));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erreur de chargement',
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [filters, page]);

  const resetFilters = () => {
    setSearch('');
    setEnterpriseId('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const { blob, filename } = await exportScansCsv({
        search: filters.search,
        enterpriseId: filters.enterpriseId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setToast({
        message: 'Export CSV généré avec succès.',
        variant: 'success',
      });
    } catch (err) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : "Erreur lors de l'export CSV",
        variant: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const hasFilters =
    Boolean(search.trim()) ||
    enterpriseId !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  const columns = [
    {
      key: 'clientName',
      header: 'Client',
      render: (scan: AdminScanData) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={scan.clientName ?? '?'}
            size="md"
            shape="circle"
          />
          <span className="font-medium text-dark">
            {scan.clientName ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'cardNumber',
      header: 'Carte',
      render: (scan: AdminScanData) => (
        <span className="font-mono text-primary text-sm">
          {scan.cardNumber ?? '—'}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'enterpriseName',
      header: 'Entreprise',
      render: (scan: AdminScanData) => (
        <span className="text-dark">
          {scan.enterpriseName ?? '—'}
        </span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'action',
      header: 'Action',
      render: (scan: AdminScanData) => {
        const points = scan.pointsAdded ?? 0;

        const variant =
          points > 0
            ? 'active'
            : points < 0
              ? 'inactive'
              : 'primary';

        return (
          <Badge
            variant={
              variant as 'active' | 'inactive' | 'primary'
            }
          >
            {scan.action}
          </Badge>
        );
      },
    },
    {
      key: 'timestamp',
      header: 'Date',
      render: (scan: AdminScanData) => (
        <div className="flex items-center gap-2 text-slate">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {formatScanDate(scan.scannedAt)}
          </span>
        </div>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">
            Scans
          </h1>
          <p className="text-slate mt-1">
            {loading
              ? 'Chargement...'
              : `${total} scan${total > 1 ? 's' : ''}${hasFilters ? ' correspondant aux filtres' : ' au total'}`}
          </p>
        </div>

        <Button
          icon={<Download className="w-5 h-5" />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting
            ? 'Export en cours...'
            : hasFilters
              ? 'Exporter les résultats'
              : 'Exporter tous les scans'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-dark">
            <Filter className="w-4 h-4 text-primary" />
            Filtres
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <SearchInput
              placeholder="Client, carte ou entreprise..."
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />

            <Select
              options={enterpriseOptions}
              value={enterpriseId}
              onChange={(value) => {
                setEnterpriseId(value);
                setPage(1);
              }}
            />

            <input
              type="date"
              aria-label="Date de début"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 bg-white border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />

            <input
              type="date"
              aria-label="Date de fin"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 bg-white border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-sm text-slate hover:text-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate animate-pulse">
            Chargement...
          </div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center text-slate">
            {hasFilters
              ? 'Aucun résultat pour ces filtres'
              : 'Aucun scan'}
          </div>
        ) : (
          <>
            <Table data={scans} columns={columns} />
            <div className="p-4 border-t border-slate/10 flex items-center justify-between">
              <p className="text-sm text-slate">
                {total} résultat{total > 1 ? 's' : ''}
              </p>

              {pages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1),
                      )
                    }
                    disabled={page === 1}
                    className="px-3 py-2 bg-cloud text-dark rounded-lg disabled:opacity-50 hover:bg-slate/10 transition-colors"
                  >
                    Précédent
                  </button>

                  <span className="px-3 py-2 text-sm text-slate">
                    {page} / {pages}
                  </span>

                  <button
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pages, current + 1),
                      )
                    }
                    disabled={page >= pages}
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
