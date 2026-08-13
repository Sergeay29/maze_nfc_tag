import React, { useEffect, useState } from 'react';
import {
  Building2,
  CreditCard,
  QrCode,
  TrendingUp
} from 'lucide-react';
import { StatCard, ChartCard, Card, Avatar, Badge, ChangePasswordModal, Toast } from '../../components';
import { getDashboard, getEnterprises } from '../../api/adminApi';
import type { AdminScanData } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { changePassword } from '../../api/authApi';
import { formatSubscriptionPrice, getSubscriptionPlanLabel } from '../../config/subscriptions';

interface DashboardStats {
  activeEnterprises: number;
  totalCards: number;
  scansThisMonth: number;
  monthlyRevenue: number;
}

interface DashboardState {
  stats: DashboardStats;
  scanTrends: Array<{ day: string; scans: number }>;
  cardStatusBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentScans: AdminScanData[];
}

const formatScanTime = (timestamp?: string): string => {
  if (!timestamp) {
    return '—';
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminDashboard: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardState>({
    stats: { activeEnterprises: 0, totalCards: 0, scansThisMonth: 0, monthlyRevenue: 0 },
    scanTrends: [],
    cardStatusBreakdown: [],
    recentScans: [],
  });
  const [activeEnterprises, setActiveEnterprises] = useState<Enterprise[]>([]);
  const navigate = useNavigate();

  // États pour le changement de mot de passe
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashboardData, enterprisesData] = await Promise.all([
          getDashboard(),
          getEnterprises({ limit: 5, status: 'active' }),
        ]);
        setData(dashboardData);
        setActiveEnterprises(enterprisesData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChangePassword = async (newPassword: string) => {
    try {
      setChangingPassword(true);
      setPasswordError(null);
      await changePassword(token!, newPassword);
      await refreshUser();
      setSuccessToast(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur lors du changement');
      throw err;
    } finally {
      setChangingPassword(false);
    }
  };

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
      {/* Toast de succès */}
      {successToast && (
        <Toast
          message="Mot de passe mis à jour avec succès !"
          variant="success"
          onClose={() => setSuccessToast(false)}
        />
      )}

      {/* Modale de changement de mot de passe obligatoire */}
      {user?.mustChangePassword && (
        <ChangePasswordModal
          onSubmit={handleChangePassword}
          loading={changingPassword}
          error={passwordError}
        />
      )}
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
          value={loading ? '...' : formatSubscriptionPrice(data.stats.monthlyRevenue)}
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
                  className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 p-3 rounded-xl hover:bg-cloud transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={scan.clientName ?? '?'} size="md" shape="circle" />
                    <div>
                      <p className="font-medium text-dark">{scan.clientName}</p>
                      <p className="text-sm text-slate">{scan.enterpriseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-dark">{scan.action ?? 'Scan'}</p>
                    <p className="text-sm text-slate">
                      {formatScanTime(scan.scannedAt)}
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
          <div className="space-y-3">
            {loading ? (
              <p className="text-slate">Chargement...</p>
            ) : activeEnterprises.length > 0 ? (
              activeEnterprises.map((e) => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/admin/enterprises/${e.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-cloud transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={e.logo} name={e.name} size="md" shape="rounded" />
                    <div>
                      <p className="font-medium text-dark text-sm">{e.name}</p>
                      <p className="text-xs text-slate">{e.location}</p>
                    </div>
                  </div>
                  <Badge
                    variant={e.subscription === 'Enterprise' ? 'platinum' : e.subscription === 'Pro' ? 'gold' : 'silver'}
                  >
                    {getSubscriptionPlanLabel(e.subscription)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-slate text-sm">Aucune entreprise active</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
