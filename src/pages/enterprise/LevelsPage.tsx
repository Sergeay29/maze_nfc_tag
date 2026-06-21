import React from 'react';
import { Crown, Star, Sparkles } from 'lucide-react';
import { Card, Badge } from '../../components';

const levels = [
  {
    name: 'Silver',
    range: '0 à 499 points',
    color: 'bg-slate-100 text-slate-700',
    border: 'border-slate-300',
    benefits: [
      'Accès aux services de base',
      'Points x1 sur tous les achats',
      'Newsletter mensuelle',
    ],
  },
  {
    name: 'Gold',
    range: '500 à 999 points',
    color: 'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-400',
    benefits: [
      'Tous les avantages Silver',
      'Points x1.5 sur tous les achats',
      'Accès prioritaire aux services',
      'Offres exclusives mensuelles',
      'Support prioritaire',
    ],
  },
  {
    name: 'Platinum',
    range: '1000+ points',
    color: 'bg-purple-100 text-purple-700',
    border: 'border-purple-400',
    benefits: [
      'Tous les avantages Gold',
      'Points x2 sur tous les achats',
      'Accès VIP aux événements',
      'Service conciergerie 24/7',
      'Avantages partenaires',
      'Remises exclusives',
    ],
  },
];

const LevelsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Niveaux de clients</h1>
        <p className="text-slate mt-1">Définissez les avantages par niveau</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {levels.map((level, index) => (
          <Card key={level.name} className={`relative overflow-hidden border-2 ${level.border}`}>
            {index === 2 && (
              <div className="absolute top-4 right-4">
                <Sparkles className="w-6 h-6 text-purple-500 animate-pulse-soft" />
              </div>
            )}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl ${level.color} flex items-center justify-center mx-auto mb-4`}>
                <Crown className={`w-8 h-8 ${index === 0 ? 'text-slate-600' : index === 1 ? 'text-yellow-600' : 'text-purple-600'}`} />
              </div>
              <h2 className="text-2xl font-bold font-poppins text-dark mb-2">
                {level.name}
              </h2>
              <Badge variant={index === 0 ? 'silver' : index === 1 ? 'gold' : 'platinum'} size="md">
                {level.range}
              </Badge>
            </div>

            <div className="space-y-3">
              {level.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-slate">{benefit}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LevelsPage;
