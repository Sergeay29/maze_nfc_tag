import React from 'react';
import {
  Building2,
  CreditCard,
  QrCode,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard, ChartCard, Card } from '../../components';
import { scanStats, cardStatusData, scans } from '../../data/mockData';

const AdminDashboard: React.FC = () => {
  const recentScans = scans.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">
            Dashboard Super Admin
          </h1>
          <p className="text-slate mt-1">
            Vue d'ensemble de la plateforme Maze NFC
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Entreprises actives"
          value="156"
          icon={<Building2 className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          gradient
        />
        <StatCard
          title="Cartes générées"
          value="12,450"
          icon={<CreditCard className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Scans ce mois"
          value="8,234"
          icon={<QrCode className="w-5 h-5" />}
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="Revenus mensuels"
          value="€45,678"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Scans des 7 derniers jours"
          data={scanStats}
          type="line"
          dataKey="scans"
          xAxisKey="day"
        />
        <ChartCard
          title="Cartes par statut"
          data={cardStatusData}
          type="donut"
          colors={['#6A35FF', '#BC43FF', '#F4C8E8']}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold font-poppins text-dark">
              Derniers scans
            </h3>
            <button className="text-sm text-primary font-medium hover:text-primary-light transition-colors duration-200">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-cloud transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {scan.clientName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-dark">{scan.clientName}</p>
                    <p className="text-sm text-slate">{scan.enterpriseName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-dark">{scan.action}</p>
                  <p className="text-sm text-slate">
                    {new Date(scan.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold font-poppins text-dark">
              Entreprises récentes
            </h3>
            <button className="text-sm text-primary font-medium hover:text-primary-light transition-colors duration-200">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Conciergerie Premium', cards: 1250, growth: 12 },
              { name: 'Auto Spa Luxe', cards: 890, growth: 8 },
              { name: 'Hôtel Riviera', cards: 2100, growth: -3 },
              { name: 'Fitness Club Elite', cards: 1560, growth: 15 },
              { name: 'Restaurant Gastronomique', cards: 320, growth: 5 },
            ].map((enterprise, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-cloud transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-light flex items-center justify-center text-primary font-semibold">
                    {enterprise.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-dark">{enterprise.name}</p>
                    <p className="text-sm text-slate">{enterprise.cards} cartes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {enterprise.growth > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      enterprise.growth > 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {Math.abs(enterprise.growth)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
