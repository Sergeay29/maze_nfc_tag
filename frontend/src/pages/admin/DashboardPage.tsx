import React, { useEffect, useState } from 'react';
import {
  Building2,
  CreditCard,
  QrCode,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard, ChartCard, Card } from '../../components';
import { getDashboard } from '../../api/adminApi';
import type { Scan } from '../../data/mockData';

interface DashboardStats {
  activeEnterprises: number;
  totalCards: number;
  scansThisMonth: number;
  monthlyRevenue: number;
}

interface DashboardState {
  stats: DashboardStats;
  scanTrends: Array<{ day: string; scans: number }>;
  cardStatusBreakdown: Array<{ name: string; value: number; color: string }>;
  recentScans: Scan[];
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardState>({
    stats: {
      activeEnterprises: 0,
      totalCards: 0,
      scansThisMonth: 0,
      monthlyRevenue: 0,
    },
    scanTrends: [],
    cardStatusBreakdown: [],
    recentScans: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await getDashboard();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold font-poppins text-dark">Dashboard Super Admin</h1>
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      </div>
    );
  }

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
          value={loading ? '...' : data.stats.activeEnterprises.toString()}
          icon={<Building2 className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          gradient
        />
        <StatCard
          title="Cartes générées"
          value={loading ? '...' : data.stats.totalCards.toLocaleString('fr-FR')}
          icon={<CreditCard className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Scans ce mois"
          value={loading ? '...' : data.stats.scansThisMonth.toLocaleString('fr-FR')}
          icon={<QrCode className="w-5 h-5" />}
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="Revenus mensuels"
          value={loading ? '...' : `€${data.stats.monthlyRevenue.toLocaleString('fr-FR')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.scanTrends.length > 0 && (
          <ChartCard
            title="Scans des 7 derniers jours"
            data={data.scanTrends}
            type="line"
            dataKey="scans"
            xAxisKey="day"
          />
        )}
        {data.cardStatusBreakdown.length > 0 && (
          <ChartCard
            title="Cartes par statut"
            data={data.cardStatusBreakdown}
            type="donut"
            colors={['#6A35FF', '#BC43FF', '#F4C8E8']}
          />
        )}
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
            {loading ? (
              <p className="text-slate">Chargement...</p>
            ) : data.recentScans.length > 0 ? (
              data.recentScans.map((scan) => (
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
              ))
            ) : (
              <p className="text-slate">Aucun scan disponible</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold font-poppins text-dark">
              Entreprises actives
            </h3>
            <button className="text-sm text-primary font-medium hover:text-primary-light transition-colors duration-200">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate">Chargement...</p>
            ) : (
              <p className="text-slate text-sm">
                {data.stats.activeEnterprises} entreprises actives
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
