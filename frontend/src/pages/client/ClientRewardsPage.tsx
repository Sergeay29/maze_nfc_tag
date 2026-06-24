import React from 'react';
import { Gift, Star } from 'lucide-react';
import { Card, Button, Badge } from '../../components';
import { rewards, clients } from '../../data/mockData';
import { ClientBottomNav } from '../../layouts/MobileLayout';

const ClientRewardsPage: React.FC = () => {
  const client = clients[0];

  return (
    <div className="min-h-screen bg-cloud pb-24">
      <div className="bg-white px-6 py-4 border-b border-slate/10 sticky top-0 z-10">
        <h1 className="text-xl font-bold font-poppins text-dark">Récompenses</h1>
        <p className="text-sm text-slate">{client.points.toLocaleString()} points disponibles</p>
      </div>

      <div className="p-4 space-y-4">
        {rewards.map((reward) => {
          const canExchange = client.points >= reward.pointsRequired;
          return (
            <Card key={reward.id} padding="none" className="overflow-hidden">
              <div className="relative h-36 overflow-hidden">
                <img
                  src={reward.image}
                  alt={reward.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <Badge variant="primary" className="mb-2">{reward.category}</Badge>
                    <h3 className="text-white font-semibold font-poppins">{reward.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-lg rounded-full px-3 py-1.5">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-white text-sm font-medium">
                      {reward.pointsRequired.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate mb-3">{reward.description}</p>
                <Button
                  fullWidth
                  disabled={!canExchange}
                  variant={canExchange ? 'primary' : 'secondary'}
                  icon={<Gift className="w-5 h-5" />}
                >
                  {canExchange ? 'Échanger' : `${(reward.pointsRequired - client.points).toLocaleString()} pts manquants`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ClientBottomNav />
    </div>
  );
};

export default ClientRewardsPage;
