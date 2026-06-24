import React from 'react';
import { Card } from '../../components';
import { Gift, Bell, ConciergeBell, Star, QrCode, BarChart3 } from 'lucide-react';

const modules = [
  { id: 'loyalty', name: 'Fidélité', icon: <Gift className="w-6 h-6" />, description: 'Système de points et fidélisation', active: 156 },
  { id: 'concierge', name: 'Conciergerie', icon: <ConciergeBell className="w-6 h-6" />, description: 'Services et réservations', active: 89 },
  { id: 'notifications', name: 'Notifications', icon: <Bell className="w-6 h-6" />, description: 'Alertes et communications', active: 134 },
  { id: 'rewards', name: 'Récompenses', icon: <Star className="w-6 h-6" />, description: 'Avantages et cadeaux', active: 112 },
  { id: 'scans', name: 'Scans', icon: <QrCode className="w-6 h-6" />, description: 'Suivi des scans NFC', active: 156 },
  { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-6 h-6" />, description: 'Tableaux de bord et rapports', active: 145 },
];

const ModulesPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Modules</h1>
        <p className="text-slate mt-1">Modules disponibles sur la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card key={module.id} hover>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center text-white">
                {module.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold font-poppins text-dark mb-1">
                  {module.name}
                </h3>
                <p className="text-sm text-slate mb-3">{module.description}</p>
                <p className="text-xs text-primary font-medium">{module.active} entreprises actives</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModulesPage;
