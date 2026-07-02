import React, { useState, useEffect } from 'react';
import { CreditCard, User } from 'lucide-react';
import { Card, Badge, Pagination } from '../../components';
import { getEnterpriseCards } from '../../api/enterpriseApi';
import type { NFCCardData } from '../../api/enterpriseApi';

const CARDS_PER_PAGE = 12;

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  unassigned: 'Non attribuée',
};

const EnterpriseCardsPage: React.FC = () => {
  const [cards, setCards] = useState<NFCCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getEnterpriseCards({ page: currentPage, limit: CARDS_PER_PAGE, status: statusFilter || undefined });
        setCards(res.data);
        setTotalPages(res.pages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [currentPage, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Cartes NFC</h1>
          <p className="text-slate mt-1">Gérez vos cartes NFC</p>
        </div>
        <div className="flex gap-2">
          {['', 'active', 'inactive', 'unassigned'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-cloud text-slate hover:text-dark'}`}
            >
              {s === '' ? 'Toutes' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : cards.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-3 text-slate">
            <CreditCard className="w-10 h-10 opacity-30" />
            <p>Aucune carte{statusFilter ? ` avec le statut "${STATUS_LABEL[statusFilter]}"` : ''}</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card key={card.id} hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={card.status === 'active' ? 'active' : card.status === 'unassigned' ? 'warning' : 'inactive'}>
                    {STATUS_LABEL[card.status]}
                  </Badge>
                </div>
                <p className="font-mono text-primary font-medium mb-1">{card.cardNumber}</p>
                <p className="text-xs text-slate font-mono mb-3">{card.cardCode}</p>
                <div className="flex items-center gap-2 text-sm text-slate">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {card.assignedClient ? card.assignedClient.name : 'Non attribuée'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      )}
    </div>
  );
};

export default EnterpriseCardsPage;
