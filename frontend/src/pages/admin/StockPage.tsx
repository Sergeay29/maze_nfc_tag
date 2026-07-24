import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, Package, Plus, ChevronRight, Warehouse } from 'lucide-react';
import { Card, StatCard, Avatar, Badge, Button } from '../../components';
import { getCardStock, getGlobalStock } from '../../api/adminApi';
import type { CardStockData, GlobalStockData } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';

const StockPage: React.FC = () => {
  const [stock, setStock] = useState<CardStockData | null>(null);
  const [globalStock, setGlobalStock] = useState<GlobalStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCardStock(), getGlobalStock()])
      .then(([stockData, globalData]) => {
        setStock(stockData);
        setGlobalStock(globalData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !stock) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error || 'Erreur'}</div>;
  }

  const { summary, byEnterprise, byType } = stock;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Gestion de stocks</h1>
          <p className="text-slate mt-1">Vue d'ensemble des cartes NFC — stock global et distribution</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => navigate('/admin/stock/assign')}
          >
            Assigner un lot
          </Button>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/admin/stock/generate')}
          >
            Générer du stock
          </Button>
        </div>
      </div>

      {/* ── STOCK GLOBAL MAZE ── */}
      <div className="p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold font-poppins text-dark">Stock global Maze</h2>
            <p className="text-xs text-slate">Cartes vierges — sans type ni entreprise, prêtes à être assignées</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold text-primary">{(globalStock?.total ?? 0).toLocaleString('fr-FR')}</p>
            <p className="text-xs text-slate">cartes disponibles</p>
          </div>
        </div>

        {(globalStock?.total ?? 0) === 0 && (
          <div className="text-center py-4">
            <p className="text-slate text-sm mb-3">Le stock est vide. Générez des cartes NFC pour commencer.</p>
            <button
              onClick={() => navigate('/admin/stock/generate')}
              className="text-primary text-sm font-medium underline hover:no-underline"
            >
              Générer du stock →
            </button>
          </div>
        )}

        {/* Lots récents */}
        {(globalStock?.byBatch ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Lots récents</p>
            <div className="space-y-1.5">
              {globalStock?.byBatch.slice(0, 4).map((b) => (
                <div key={b.batchId} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-slate flex-shrink-0" />
                    <span className="font-mono text-xs text-slate truncate">{b.batchId}</span>
                    <span className="text-xs text-slate italic">— cartes vierges</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-semibold text-dark text-sm">{b.count} cartes</span>
                    <button
                      onClick={() => navigate('/admin/stock/assign')}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Assigner →
                    </button>
                  </div>
                </div>
              ))}
              {(globalStock?.byBatch.length ?? 0) > 4 && (
                <p className="text-xs text-slate text-center pt-1">
                  +{(globalStock?.byBatch.length ?? 0) - 4} autres lots
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── STATS GLOBALES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total généré"
          value={summary.total.toLocaleString('fr-FR')}
          icon={<Package className="w-5 h-5" />}
          gradient
        />
        <StatCard
          title="Actives (client)"
          value={summary.active.toLocaleString('fr-FR')}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Dispo (entreprise)"
          value={summary.availableForEnterprise.toLocaleString('fr-FR')}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Inactives"
          value={summary.inactive.toLocaleString('fr-FR')}
          icon={<XCircle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition par type */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Par type de carte</h2>
          <div className="space-y-3">
            {byType.map((t) => (
              <div key={t.type} className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-dark">{t.type}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dark">{t.total.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-slate">
                    {summary.total > 0 ? Math.round((t.total / summary.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
            {byType.length === 0 && (
              <p className="text-slate text-sm text-center py-4">Aucune carte générée</p>
            )}
          </div>

          {/* Barre de progression */}
          <div className="mt-4 pt-4 border-t border-slate/10 space-y-2">
            <div className="flex justify-between text-xs text-slate mb-1">
              <span>Taux d'attribution (clients)</span>
              <span>{summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-cloud rounded-full h-2">
              <div
                className="bg-gradient h-2 rounded-full transition-all duration-500"
                style={{ width: `${summary.total > 0 ? (summary.active / summary.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate">
              <span className="text-green-600">{summary.active} actives</span>
              <span className="text-amber-600">{summary.availableForEnterprise} dispo entreprise</span>
              <span className="text-primary">{summary.globalStock} stock Maze</span>
            </div>
          </div>
        </Card>

        {/* Stock par entreprise */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Stock par entreprise</h2>
          {byEnterprise.length === 0 ? (
            <p className="text-slate text-sm">Aucune entreprise avec des cartes</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {byEnterprise
                .sort((a, b) => b.total - a.total)
                .map((e) => (
                  <div key={e.enterpriseId} className="flex items-center gap-3 p-3 bg-cloud rounded-xl">
                    <Avatar src={e.logo} name={e.name} size="md" shape="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark text-sm truncate">{e.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-white rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${e.total > 0 ? (e.active / e.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate whitespace-nowrap">
                          {e.active}/{e.total}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      <Badge variant="active" size="sm">{e.active} actives</Badge>
                      <Badge variant="warning" size="sm">{e.unassigned} dispo</Badge>
                      {e.inactive > 0 && (
                        <Badge variant="inactive" size="sm">{e.inactive} inactives</Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StockPage;
