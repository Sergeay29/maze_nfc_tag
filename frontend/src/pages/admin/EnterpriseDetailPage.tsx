import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Gift,
  Bell,
  ConciergeBell,
  Star,
  PowerOff,
  Power,
  CreditCard,
  Users,
  QrCode,
  TrendingUp,
} from 'lucide-react';
import { Card, Badge, Tabs, StatCard } from '../../components';
import { getEnterpriseDetail, updateEnterprise } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';

interface EnterpriseDetailData extends Enterprise {
  totalClients: number;
  totalScans: number;
  activeCards: number;
  NFCCards?: Array<{ id: string; status: string; cardNumber?: string }>;
  Clients?: Array<{ id: string; name: string }>;
  Scans?: Array<{ id: string; createdAt: string; pointsAdded?: number }>;
  Subscription?: { plan: string; status: string; monthlyPrice: number };
}

const EnterpriseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [enterprise, setEnterprise] = useState<EnterpriseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchEnterprise = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEnterpriseDetail(id);
        setEnterprise(data as EnterpriseDetailData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchEnterprise();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!enterprise || !id) return;

    const newStatus = enterprise.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      newStatus === 'suspended'
        ? `Suspendre l'entreprise "${enterprise.name}" ? Elle ne pourra plus accéder à la plateforme.`
        : `Réactiver l'entreprise "${enterprise.name}" ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setStatusUpdating(true);
      await updateEnterprise(id, { status: newStatus });
      setEnterprise((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setStatusUpdating(false);
    }
  };

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'cards', label: 'Cartes' },
    { id: 'clients', label: 'Clients' },
    { id: 'scans', label: 'Scans' },
  ];

  const moduleIcons: Record<string, React.ReactNode> = {
    Fidélité: <Gift className="w-5 h-5" />,
    Conciergerie: <ConciergeBell className="w-5 h-5" />,
    Notifications: <Bell className="w-5 h-5" />,
    Récompenses: <Star className="w-5 h-5" />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (error || !enterprise) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux entreprises
        </button>
        <div className="p-4 bg-red-100 text-red-700 rounded-xl">
          {error || 'Entreprise non trouvée'}
        </div>
      </div>
    );
  }

  const totalCards = enterprise.NFCCards?.length ?? enterprise.cardsCount ?? 0;
  const activeCards =
    enterprise.activeCards ??
    enterprise.NFCCards?.filter((c) => c.status === 'active').length ??
    0;
  const totalClients = enterprise.totalClients ?? enterprise.Clients?.length ?? 0;
  const totalScans = enterprise.totalScans ?? enterprise.Scans?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate hover:text-primary transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux entreprises
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Sidebar infos */}
        <Card className="lg:w-80 flex-shrink-0">
          <div className="text-center">
            {enterprise.logo ? (
              <img
                src={enterprise.logo}
                alt={enterprise.name}
                className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold font-poppins text-dark mb-2">
              {enterprise.name}
            </h1>
            <Badge
              variant={enterprise.status === 'active' ? 'active' : 'inactive'}
              size="md"
            >
              {enterprise.status === 'active' ? 'Actif' : 'Suspendu'}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-slate">
              <Mail className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{enterprise.email}</span>
            </div>
            {enterprise.phone && (
              <div className="flex items-center gap-3 text-slate">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>{enterprise.phone}</span>
              </div>
            )}
            {enterprise.location && (
              <div className="flex items-center gap-3 text-slate">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>{enterprise.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <span>
                Créé le{' '}
                {new Date(enterprise.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate/10">
            <p className="text-sm text-slate mb-2">Abonnement</p>
            <Badge
              variant={
                enterprise.subscription === 'Enterprise'
                  ? 'platinum'
                  : enterprise.subscription === 'Pro'
                  ? 'gold'
                  : 'silver'
              }
              size="md"
            >
              {enterprise.subscription}
            </Badge>
          </div>

          {/* Bouton activation / suspension */}
          <div className="mt-6 pt-6 border-t border-slate/10">
            <button
              onClick={handleToggleStatus}
              disabled={statusUpdating}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
                enterprise.status === 'active'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
            >
              {enterprise.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  {statusUpdating ? 'Suspension...' : 'Suspendre'}
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  {statusUpdating ? 'Activation...' : 'Réactiver'}
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Contenu principal */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Cartes totales"
              value={totalCards.toLocaleString('fr-FR')}
              icon={<CreditCard className="w-5 h-5" />}
            />
            <StatCard
              title="Cartes actives"
              value={activeCards.toLocaleString('fr-FR')}
              icon={<CreditCard className="w-5 h-5" />}
            />
            <StatCard
              title="Clients"
              value={totalClients.toLocaleString('fr-FR')}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Scans totaux"
              value={totalScans.toLocaleString('fr-FR')}
              icon={<QrCode className="w-5 h-5" />}
            />
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                  Modules actifs
                </h3>
                {enterprise.modules && enterprise.modules.length > 0 ? (
                  <div className="space-y-3">
                    {enterprise.modules.map((module) => (
                      <div
                        key={module}
                        className="flex items-center gap-3 p-3 bg-cloud rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center text-white">
                          {moduleIcons[module] ?? (
                            <TrendingUp className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-medium text-dark">{module}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate text-sm">Aucun module actif</p>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                  Activité récente
                </h3>
                {enterprise.Scans && enterprise.Scans.length > 0 ? (
                  <div className="space-y-3">
                    {enterprise.Scans.slice(0, 5).map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 bg-cloud rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center">
                            <QrCode className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark">
                              {scan.pointsAdded
                                ? `+${scan.pointsAdded} points`
                                : 'Consultation'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate">
                          {new Date(scan.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate text-sm">Aucune activité récente</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'cards' && (
            <Card>
              {enterprise.NFCCards && enterprise.NFCCards.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                    {enterprise.NFCCards.length} carte
                    {enterprise.NFCCards.length > 1 ? 's' : ''} NFC
                  </h3>
                  {enterprise.NFCCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 bg-cloud rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="font-mono text-sm text-dark">
                          {card.cardNumber ?? card.id}
                        </span>
                      </div>
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate">Aucune carte pour cette entreprise</p>
              )}
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card>
              {enterprise.Clients && enterprise.Clients.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                    {enterprise.Clients.length} client
                    {enterprise.Clients.length > 1 ? 's' : ''}
                  </h3>
                  {enterprise.Clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 p-3 bg-cloud rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {client.name?.charAt(0) ?? '?'}
                        </span>
                      </div>
                      <span className="font-medium text-dark">{client.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate">Aucun client pour cette entreprise</p>
              )}
            </Card>
          )}

          {activeTab === 'scans' && (
            <Card>
              {enterprise.Scans && enterprise.Scans.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                    {enterprise.Scans.length} scan
                    {enterprise.Scans.length > 1 ? 's' : ''}
                  </h3>
                  {enterprise.Scans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-3 bg-cloud rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="w-5 h-5 text-primary" />
                        <span className="text-sm text-dark">
                          {scan.pointsAdded
                            ? `+${scan.pointsAdded} points`
                            : 'Consultation'}
                        </span>
                      </div>
                      <span className="text-xs text-slate">
                        {new Date(scan.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate">Aucun scan pour cette entreprise</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDetailPage;
