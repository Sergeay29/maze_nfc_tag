import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { Card, StatCard, Avatar, Badge } from '../../components';
import { getCardStock } from '../../api/adminApi';
import type { CardStockData } from '../../api/adminApi';

const StockPage: React.FC = () => {
  const [stock, setStock] = useState<CardStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCardStock()
      .then(setStock)
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
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Gestion de stocks</h1>
        <p className="text-slate mt-1">Vue d'ensemble des cartes NFC générées et distribuées</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total généré"
          value={summary.total.toLocaleString('fr-FR')}
          icon={<Package className="w-5 h-5" />}
          gradient
        />
        <StatCard
          title="Vendues / Actives"
          value={summary.active.toLocaleString('fr-FR')}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Disponibles"
          value={summary.unassigned.toLocaleString('fr-FR')}
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
          </div>

          {/* Barre de progression globale */}
          <div className="mt-4 pt-4 border-t border-slate/10 space-y-2">
            <div className="flex justify-between text-xs text-slate mb-1">
              <span>Taux d'attribution</span>
              <span>{summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-cloud rounded-full h-2">
              <div
                className="bg-gradient h-2 rounded-full transition-all duration-500"
                style={{ width: `${summary.total > 0 ? (summary.active / summary.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate">
              <span className="text-green-600">{summary.active} attribuées</span>
              <span className="text-amber-600">{summary.unassigned} disponibles</span>
            </div>
          </div>
        </Card>

        {/* Stock par entreprise */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Stock par entreprise</h2>
          {byEnterprise.length === 0 ? (
            <p className="text-slate text-sm">Aucune donnée</p>
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
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge variant="active" size="sm">{e.active} actives</Badge>
                      <Badge variant="warning" size="sm">{e.unassigned} dispo</Badge>
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
