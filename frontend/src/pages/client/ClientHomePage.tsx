import React from 'react';
import { Crown, Gift, ChevronRight, Star } from 'lucide-react';
import { Card, Badge, ProgressBar } from '../../components';
import { rewards, pointsHistory } from '../../data/mockData';
import { ClientBottomNav } from '../../layouts/MobileLayout';
import { useClientAuth } from '../../auth/client/useClientAuth';

const ClientHomePage: React.FC = () => {
  const { client } = useClientAuth();
  if (!client) return null;

  const pointsToNextReward = 500 - (client.points % 500);

  const recentActivity = pointsHistory.slice(0, 3);
  const availableRewards = rewards.filter(r => r.pointsRequired <= client.points);

  return (
    <div className="min-h-screen bg-cloud pb-24">
      <div className="bg-gradient px-6 pt-8 pb-16 rounded-b-3xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 mx-auto mb-4 overflow-hidden flex items-center justify-center">
            {client.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-2xl font-bold">{client.name.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white font-poppins mb-1">
            {client.name}
          </h1>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-lg rounded-full px-4 py-1.5">
            <Crown className="w-4 h-4 text-yellow-300" />
            <span className="text-white font-medium text-sm">{client.level}</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/80 text-sm">Solde de points</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-xs">
                {pointsToNextReward} pts jusqu'à la prochaine récompense
              </span>
            </div>
          </div>
          <p className="text-4xl font-bold text-white font-poppins mb-4">
            {client.points.toLocaleString()}
          </p>
          <ProgressBar
            current={client.points % 500}
            max={500}
            showPercentage={false}
            color="primary"
          />
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-dark">Voir mes avantages</p>
              <p className="text-sm text-slate">{availableRewards.length} récompenses disponibles</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate" />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-poppins text-dark">Dernières activités</h2>
            <span className="text-xs text-slate">{recentActivity.length} transactions</span>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-slate/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.points > 0 ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">{activity.action}</p>
                    <p className="text-xs text-slate">{activity.reason}</p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  activity.points > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.points > 0 ? '+' : ''}{activity.points}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-poppins text-dark">Mes avantages</h2>
            <Badge variant="platinum">{client.level}</Badge>
          </div>
          <div className="space-y-3">
            {[
              'Accès VIP aux événements',
              'Points x2 sur tous les achats',
              'Service conciergerie 24/7',
            ].map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-2"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-sm text-dark">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ClientBottomNav />
    </div>
  );
};

export default ClientHomePage;
