import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, Badge } from '../../components';
import { nfcCards } from '../../data/mockData';

const EnterpriseCardsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Cartes NFC</h1>
        <p className="text-slate mt-1">Gérez vos cartes NFC</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfcCards.filter(c => c.enterpriseId === '1').map((card) => (
          <Card key={card.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <Badge variant={card.status === 'active' ? 'active' : 'inactive'}>
                {card.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="font-mono text-primary mb-2">{card.number}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate">{card.type}</span>
              <span className="text-slate">{card.assignedTo || 'Non attribuée'}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnterpriseCardsPage;
