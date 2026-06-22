import React from 'react';
import { Bell, Clock } from 'lucide-react';
import { Card } from '../../components';

const notifications = [
  { id: '1', title: 'Nouveau client inscrit', message: 'Alice Martin a rejoint le programme', time: '2 min' },
  { id: '2', title: 'Niveau Gold atteint', message: 'Bob Durand a atteint le niveau Gold', time: '15 min' },
  { id: '3', title: 'Récompense échangée', message: 'Charles a échangé 500 points', time: '1h' },
  { id: '4', title: 'Scan détecté', message: 'Nouvelle activité au point de vente', time: '2h' },
];

const EnterpriseNotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Notifications</h1>
        <p className="text-slate mt-1">Centre de notifications</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <Card key={notif.id} hover>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-dark">{notif.title}</h3>
                <p className="text-sm text-slate">{notif.message}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate">
                <Clock className="w-3 h-3" />
                <span>{notif.time}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnterpriseNotificationsPage;
