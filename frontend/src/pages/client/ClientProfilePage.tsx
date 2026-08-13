import React from 'react';
import { Mail, Phone, CreditCard, Crown, LogOut, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../../components';
import { clients, pointsHistory } from '../../data/mockData';
import { ClientBottomNav } from '../../layouts/MobileLayout';

const ClientProfilePage: React.FC = () => {
  const client = clients[0];
  const totalPoints = pointsHistory.reduce((sum, h) => sum + h.points, 0);

  return (
    <div className="min-h-screen bg-cloud pb-24">
      <div className="bg-white px-6 py-8 text-center border-b border-slate/10">
        <div className="w-24 h-24 rounded-2xl bg-gradient mx-auto mb-4 overflow-hidden">
          <img
            src={client.photo}
            alt={client.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-xl font-bold font-poppins text-dark mb-2">{client.name}</h1>
        <Badge variant={client.level === 'Platinum' ? 'platinum' : client.level === 'Gold' ? 'gold' : 'silver'} size="md">
          <Crown className="w-4 h-4 mr-1" />
          {client.level}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <h2 className="font-semibold font-poppins text-dark mb-4">Informations</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate">Email</p>
                <p className="text-sm font-medium text-dark">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate">Téléphone</p>
                <p className="text-sm font-medium text-dark">{client.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate">Carte NFC</p>
                <p className="text-sm font-mono font-medium text-primary">{client.card?.cardNumber ?? 'Aucune carte attribuée'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold font-poppins text-dark mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cloud rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-poppins text-primary">{client.points.toLocaleString()}</p>
              <p className="text-xs text-slate">Points actuels</p>
            </div>
            <div className="bg-cloud rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-poppins text-dark">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-slate">Points gagnés</p>
            </div>
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium text-red-500">Déconnexion</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate" />
        </Card>
      </div>

      <ClientBottomNav />
    </div>
  );
};

export default ClientProfilePage;
