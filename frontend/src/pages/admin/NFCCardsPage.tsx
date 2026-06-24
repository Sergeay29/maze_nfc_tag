import React, { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button, Badge, Table, SearchInput, Card, Pagination } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getCards } from '../../api/adminApi';
import type { NFCCard } from '../../data/mockData';

const NFCCardsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'unassigned'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<NFCCard[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getCards({
          page,
          limit,
          search,
          status: statusFilter,
        });
        setCards(result.data);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        console.error('Error fetching cards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [page, search, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  const columns = [
    {
      key: 'number',
      header: 'Carte',
      render: (card: NFCCard) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
            <span className="text-white text-xs font-bold">NFC</span>
          </div>
          <span className="font-mono font-medium">{card.number}</span>
        </div>
      ),
    },
    {
      key: 'enterpriseName',
      header: 'Entreprise',
      className: 'hidden md:table-cell',
    },
    {
      key: 'type',
      header: 'Type',
      render: (card: NFCCard) => (
        <Badge variant="primary">{card.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (card: NFCCard) => (
        <Badge
          variant={
            card.status === 'active'
              ? 'active'
              : card.status === 'inactive'
                ? 'inactive'
                : 'warning'
          }
        >
          {card.status === 'active'
            ? 'Active'
            : card.status === 'inactive'
              ? 'Inactive'
              : 'Non attribuée'}
        </Badge>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Attribuée à',
      render: (card: NFCCard) => (
        <span className="text-slate">{card.assignedTo || '-'}</span>
      ),
      className: 'hidden sm:table-cell',
    },
    {
      key: 'createdAt',
      header: 'Créée le',
      render: (card: NFCCard) => (
        <span className="text-slate">
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
          <p className="text-slate mt-1">Liste de toutes les cartes générées</p>
        </div>
        <Button
          icon={<Plus className="w-5 h-5" />}
          onClick={() => navigate('/admin/nfc-cards/generate')}
        >
          Générer des cartes
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher par numéro ou entreprise..."
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as 'all' | 'active' | 'inactive' | 'unassigned'
                  )
                }
                className="px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="unassigned">Non attribuée</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate">Chargement...</div>
        ) : cards.length === 0 ? (
          <div className="p-8 text-center text-slate">Aucune carte trouvée</div>
        ) : (
          <>
            <Table data={cards} columns={columns} />
            <div className="p-4 border-t border-slate/10">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default NFCCardsPage;
