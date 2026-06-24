import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from 'lucide-react';
import {
  Card,
  Badge,
  Tabs,
  StatCard,
} from '../../components';
import { enterprises, nfcCards, clients, scans } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const EnterpriseDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const enterprise = enterprises.find((e) => e.id === id);

  if (!enterprise) {
    return (
      <div className="text-center py-12">
        <p className="text-slate">Entreprise non trouvée</p>
      </div>
    );
  }

  const enterpriseCards = nfcCards.filter((c) => c.enterpriseId === id);
  const enterpriseClients = clients.filter((c) => c.enterpriseId === id);
  const enterpriseScans = scans.filter((s) => s.enterpriseId === id);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'cards', label: 'Cartes' },
    { id: 'clients', label: 'Clients' },
    { id: 'scans', label: 'Scans' },
    { id: 'revenue', label: 'Revenus' },
  ];

  const moduleIcons: Record<string, React.ReactNode> = {
    'Fidélité': <Gift className="w-5 h-5" />,
    'Conciergerie': <ConciergeBell className="w-5 h-5" />,
    'Notifications': <Bell className="w-5 h-5" />,
    'Récompenses': <Star className="w-5 h-5" />,
  };

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
        <Card className="lg:w-80 flex-shrink-0">
          <div className="text-center">
            <img
              src={enterprise.logo}
              alt={enterprise.name}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4"
            />
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
              <Mail className="w-5 h-5" />
              <span>{enterprise.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate">
              <Phone className="w-5 h-5" />
              <span>{enterprise.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate">
              <MapPin className="w-5 h-5" />
              <span>{enterprise.location}</span>
            </div>
            <div className="flex items-center gap-3 text-slate">
              <Calendar className="w-5 h-5" />
              <span>Créé le {new Date(enterprise.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate/10">
            <p className="text-sm text-slate mb-2">Abonnement</p>
            <Badge
              variant={
                enterprise.subscription === 'Enterprise' ? 'platinum' :
                enterprise.subscription === 'Pro' ? 'gold' : 'silver'
              }
              size="md"
            >
              {enterprise.subscription}
            </Badge>
          </div>
        </Card>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Cartes"
              value={enterprise.cardsCount.toLocaleString()}
              icon={<Building2 className="w-5 h-5" />}
            />
            <StatCard
              title="Clients"
              value={enterpriseClients.length.toString()}
              icon={<Building2 className="w-5 h-5" />}
            />
            <StatCard
              title="Scans du mois"
              value={enterpriseScans.length.toString()}
              icon={<Building2 className="w-5 h-5" />}
            />
            <StatCard
              title="Revenus"
              value="€12,450"
              icon={<Building2 className="w-5 h-5" />}
            />
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                  Modules actifs
                </h3>
                <div className="space-y-3">
                  {enterprise.modules.map((module) => (
                    <div
                      key={module}
                      className="flex items-center gap-3 p-3 bg-cloud rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center text-white">
                        {moduleIcons[module]}
                      </div>
                      <span className="font-medium text-dark">{module}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold font-poppins text-dark mb-4">
                  Activité récente
                </h3>
                <div className="space-y-3">
                  {enterpriseScans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-3 bg-cloud rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {scan.clientName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark">{scan.clientName}</p>
                          <p className="text-xs text-slate">{scan.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate">
                        {new Date(scan.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'cards' && (
            <Card>
              <p className="text-slate">Liste des {enterpriseCards.length} cartes</p>
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card>
              <p className="text-slate">Liste des {enterpriseClients.length} clients</p>
            </Card>
          )}

          {activeTab === 'scans' && (
            <Card>
              <p className="text-slate">Liste des {enterpriseScans.length} scans</p>
            </Card>
          )}

          {activeTab === 'revenue' && (
            <Card>
              <p className="text-slate">Détails des revenus</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDetailPage;
