import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, CreditCard } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getCards } from '../../api/adminApi';
import type { NFCCard } from '../../data/mockData';

const PAGE_SIZE = 10;

const NFCCardsPage: React.FC = () => {
  const [allCards, setAllCards] = useState<NFCCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'unassigned'>('all');
  const [enterpriseFilter, setEnterpriseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NFCCard['type']>('all');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getCards({ page: 1, limit: 1000 });
        setAllCards(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  const enterpriseOptions = useMemo(() => {
    const list = Array.from(
      new Set(allCards.map((card) => card.enterpriseName?.trim() || 'Sans entreprise'))
    );
    return list.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [allCards]);

  const filtered = useMemo(() => {
    let list = allCards;
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (enterpriseFilter !== 'all') {
      list = list.filter((c) => (c.enterpriseName ?? 'Sans entreprise') === enterpriseFilter);
    }
    if (typeFilter !== 'all') {
      list = list.filter((c) => c.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.cardNumber ?? c.number ?? '').toLowerCase().includes(q) ||
          (c.enterpriseName ?? '').toLowerCase().includes(q) ||
          (c.type ?? '').toLowerCase().includes(q) ||
          (c.subtype ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCards, search, statusFilter, enterpriseFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleStatusFilter = (val: string) => {
    setStatusFilter(val as typeof statusFilter);
    setPage(1);
  };

  const columns = [
    {
      key: 'cardNumber',
      header: 'Carte',
      render: (card: NFCCard) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono text-sm font-medium text-dark">
            {card.cardNumber ?? card.number}
          </span>
        </div>
      ),
    },
    {
      key: 'enterpriseName',
      header: 'Entreprise',
      render: (card: NFCCard) => (
        <span className="text-dark">{card.enterpriseName ?? '—'}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'type',
      header: 'Type',
      render: (card: NFCCard) => (
        <Badge variant="primary">
          {card.type}
          {card.subtype && ` (${card.subtype})`}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (card: NFCCard) => (
        <Badge variant={card.status === 'active' ? 'active' : card.status === 'inactive' ? 'inactive' : 'warning'}>
          {card.status === 'active' ? 'Active' : card.status === 'inactive' ? 'Inactive' : 'Non attribuée'}
        </Badge>
      ),
    },
    {
      key: 'scanCount',
      header: 'Scans',
      render: (card: NFCCard) => (
        <span className="text-dark font-medium">{card.scanCount ?? 0}</span>
      ),
      className: 'hidden xl:table-cell',
    },
    {
      key: 'assignedTo',
      header: 'Attribuée à',
      render: (card: NFCCard) => (
        <span className="text-slate">{card.assignedTo ?? '—'}</span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'createdAt',
      header: 'Créée le',
      render: (card: NFCCard) => (
        <span className="text-slate text-sm">
          {new Date(card.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Cartes NFC</h1>
          <p className="text-slate mt-1">
            {loading ? 'Chargement...' : `${allCards.length} carte${allCards.length > 1 ? 's' : ''} au total`}
          </p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => navigate('/admin/nfc-cards/generate')}>
          Générer des cartes
        </Button>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <Card padding="none">
        <div className="flex min-h-[460px] flex-col">
          <div className="p-4 border-b border-slate/10">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <SearchInput
                    placeholder="Rechercher par numéro, entreprise, type..."
                    value={search}
                    onChange={handleSearch}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate flex-shrink-0" />
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="unassigned">Non attribuée</option>
                    </select>
                  </div>
                  <select
                    value={enterpriseFilter}
                    onChange={(e) => { setEnterpriseFilter(e.target.value); setPage(1); }}
                    className="px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
                  >
                    <option value="all">Toutes les entreprises</option>
                    {enterpriseOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}
                    className="px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
                  >
                    <option value="all">Tous les types</option>
                    <option value="Fidélité Entreprise">Fidélité Entreprise</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Carte de visite">Carte de visite</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-slate">
              {search || statusFilter !== 'all' ? 'Aucun résultat pour ces filtres' : 'Aucune carte'}
            </div>
          ) : (
            <>
                  <div className="flex-1">
                    <Table data={paginated} columns={columns} />
                  </div>
              <div className="p-4 border-t border-slate/10 flex items-center justify-between">
                <p className="text-sm text-slate">
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                  {(search || statusFilter !== 'all') && ` · ${allCards.length} au total`}
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
        </div>
      </Card>
    </div>
  );
}

export default NFCCardsPage;
