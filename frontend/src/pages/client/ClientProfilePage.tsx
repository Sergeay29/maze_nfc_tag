import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, CreditCard, Crown, LogOut, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../../components';
import { ClientBottomNav } from '../../layouts/MobileLayout';
import { useClientAuth } from '../../auth/client/useClientAuth';

const ClientProfilePage: React.FC = () => {
  const { client, logout } = useClientAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/client/login', { replace: true });
  };

  if (!client) return null;

  return (
    <div className="min-h-screen bg-cloud pb-24">
      <div className="bg-white px-6 py-8 text-center border-b border-slate/10">
        <div className="w-24 h-24 rounded-2xl bg-gradient mx-auto mb-4 overflow-hidden flex items-center justify-center">
          {client.photo ? (
            <img
              src={client.photo}
              alt={client.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-3xl font-bold font-poppins">
              {client.name.charAt(0)}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold font-poppins text-dark mb-2">{client.name}</h1>
        {client.Enterprise && (
          <p className="text-sm text-slate mb-2">{client.Enterprise.name}</p>
        )}
        <Badge
          variant={
            client.level === 'Platinum' ? 'platinum' : client.level === 'Gold' ? 'gold' : 'silver'
          }
          size="md"
        >
          <Crown className="w-4 h-4 mr-1" />
          {client.level}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <h2 className="font-semibold font-poppins text-dark mb-4">Informations</h2>
          <div className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate">Email</p>
                  <p className="text-sm font-medium text-dark">{client.email}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate">Téléphone</p>
                  <p className="text-sm font-medium text-dark">{client.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate">Programme fidélité</p>
                <p className="text-sm font-medium text-primary">
                  {client.Enterprise?.name ?? 'Mon établissement'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold font-poppins text-dark mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cloud rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-poppins text-primary">
                {client.points.toLocaleString()}
              </p>
              <p className="text-xs text-slate">Points actuels</p>
            </div>
            <div className="bg-cloud rounded-xl p-4 text-center">
              <p className="text-2xl font-bold font-poppins text-dark">{client.level}</p>
              <p className="text-xs text-slate">Niveau</p>
            </div>
          </div>
        </Card>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full"
        >
          <Card className="flex items-center justify-between hover:bg-red-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-medium text-red-500">Déconnexion</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate" />
          </Card>
        </button>
      </div>

      <ClientBottomNav />
    </div>
  );
};

export default ClientProfilePage;
