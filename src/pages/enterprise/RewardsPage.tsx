import React from 'react';
import { Gift } from 'lucide-react';
import { Card, Button, Badge } from '../../components';
import { rewards } from '../../data/mockData';

const RewardsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Récompenses</h1>
        <p className="text-slate mt-1">Gérez les récompenses disponibles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <Card key={reward.id} padding="none" className="overflow-hidden">
            <div className="relative h-40 overflow-hidden">
              <img
                src={reward.image}
                alt={reward.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <Badge variant="primary">{reward.category}</Badge>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold font-poppins text-dark mb-2">
                {reward.title}
              </h3>
              <p className="text-sm text-slate mb-4">{reward.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {reward.pointsRequired.toLocaleString()} pts
                  </span>
                </div>
                <Button size="sm">Échanger</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient rounded-xl text-white">
          <div>
            <h3 className="font-semibold text-lg">Créer une nouvelle récompense</h3>
            <p className="text-white/80 text-sm">Ajoutez une nouvelle récompense pour vos clients</p>
          </div>
          <Button variant="secondary">Nouvelle récompense</Button>
        </div>
      </Card>
    </div>
  );
};

export default RewardsPage;
