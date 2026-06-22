import React from 'react';
import { Card } from '../../components';

const SubscriptionsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">Abonnements</h1>
        <p className="text-slate mt-1">Gérez les abonnements des entreprises</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Starter', 'Pro', 'Enterprise'].map((plan, index) => (
          <Card key={plan} className={index === 2 ? 'ring-2 ring-primary' : ''}>
            <div className="text-center">
              <h3 className="text-xl font-bold font-poppins text-dark mb-2">{plan}</h3>
              <p className="text-4xl font-bold font-poppins text-primary mb-6">
                {plan === 'Starter' ? '29€' : plan === 'Pro' ? '79€' : '199€'}
                <span className="text-base text-slate font-normal">/mois</span>
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>Jusqu'à {plan === 'Starter' ? '100' : plan === 'Pro' ? '500' : '∞'} cartes</span>
              </div>
              <div className="flex items-center gap-2 text-slate">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>{plan === 'Starter' ? '1' : plan === 'Pro' ? '3' : '∞'} modules</span>
              </div>
              <div className="flex items-center gap-2 text-slate">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span>Support {plan === 'Starter' ? 'Email' : plan === 'Pro' ? 'Chat' : '24/7'}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
