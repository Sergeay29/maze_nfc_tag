import React, { useState, useEffect } from 'react';
import { CreditCard, User, UserPlus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, Badge, Pagination,  Input, Toast } from '../../components';
import { getEnterpriseCards, assignCard, getClients, updateEnterpriseCardStatus } from '../../api/enterpriseApi';
import type { NFCCardData, ClientData } from '../../api/enterpriseApi';

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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  // Modal attribution
  const [assignModal, setAssignModal] = useState<NFCCardData | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchCards = async () => {
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

  useEffect(() => { fetchCards(); }, [currentPage, statusFilter]);

  const openAssignModal = async (card: NFCCardData) => {
    setAssignModal(card);
    setClientSearch('');
    try {
      const res = await getClients({ limit: 100 });
      setClients(res.data);
    } catch { }
  };

  const handleAssign = async (clientId: string | null) => {
    if (!assignModal) return;
    try {
      setAssigning(true);
      const updated = await assignCard(assignModal.id, clientId);
      setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      setAssignModal(null);
      setToast({
        message: clientId ? 'Carte attribuée avec succès !' : 'Carte désassignée avec succès !',
        variant: 'success',
      });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Erreur lors de l'attribution", variant: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleToggleStatus = async (card: NFCCardData) => {
    if (!card.assignedClient) return;
    const newStatus = card.status === 'active' ? 'inactive' : 'active';
    try {
      setTogglingId(card.id);
      await updateEnterpriseCardStatus(card.id, newStatus as 'active' | 'inactive');
      setCards((prev) =>
        prev.map((c) => c.id === card.id ? { ...c, status: newStatus as NFCCardData['status'] } : c)
      );
      setToast({
        message: newStatus === 'active' ? 'Carte activée avec succès !' : 'Carte désactivée avec succès !',
        variant: 'success',
      });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur lors du changement de statut', variant: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{card.assignedClient ? card.assignedClient.name : 'Non attribuée'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Toggle activation uniquement si attribuée à un client */}
                    {card.assignedClient && (
                      <button
                        onClick={() => handleToggleStatus(card)}
                        disabled={togglingId === card.id}
                        title={card.status === 'active' ? 'Désactiver la carte' : 'Activer la carte'}
                        className={`p-1.5 rounded-lg transition-colors ${togglingId === card.id ? 'opacity-50 cursor-wait' :
                          card.status === 'active'
                            ? 'text-green-600 hover:bg-red-50 hover:text-red-600'
                            : 'text-red-500 hover:bg-green-50 hover:text-green-600'
                          }`}
                      >
                        {card.status === 'active'
                          ? <ToggleRight className="w-4 h-4" />
                          : <ToggleLeft className="w-4 h-4" />
                        }
                      </button>
                    )}
                    <button
                      onClick={() => openAssignModal(card)}
                      className="p-1.5 rounded-lg hover:bg-cloud transition-colors text-slate hover:text-primary"
                      title="Attribuer / modifier"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      )}

      {/* MODAL ATTRIBUTION */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-cloud">
              <div>
                <h3 className="font-semibold font-poppins text-dark">Attribuer la carte</h3>
                <p className="text-xs text-slate font-mono mt-0.5">{assignModal.cardCode}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="p-2 rounded-xl hover:bg-cloud"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Input placeholder="Rechercher un client..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {assignModal.assignedClient && (
                  <button
                    onClick={() => handleAssign(null)}
                    disabled={assigning}
                    className="w-full text-left px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm hover:bg-red-100 transition-colors"
                  >
                    Désassigner (retirer le client)
                  </button>
                )}
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleAssign(client.id)}
                    disabled={assigning}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${assignModal.assignedClient?.id === client.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-cloud hover:border-primary hover:bg-primary/5'
                      }`}
                  >
                    <p className="font-medium text-dark">{client.name}</p>
                    {client.email && <p className="text-xs text-slate">{client.email}</p>}
                  </button>
                ))}
                {filteredClients.length === 0 && <p className="text-center text-slate text-sm py-4">Aucun client trouvé</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseCardsPage;
