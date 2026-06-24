import React, { useState } from 'react';
import { ArrowLeft, Sparkles, CreditCard } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components';
import { enterprises } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const GenerateCardsPage: React.FC = () => {
  const [enterprise, setEnterprise] = useState('');
  const [cardType, setCardType] = useState('');
  const [prefix, setPrefix] = useState('');
  const [quantity, setQuantity] = useState('100');
  const navigate = useNavigate();

  const enterpriseOptions = enterprises.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const cardTypeOptions = [
    { value: 'loyalty', label: 'Fidélité' },
    { value: 'vip', label: 'VIP' },
    { value: 'business', label: 'Business' },
    { value: 'client', label: 'Client' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-cloud transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">
            Générer des cartes NFC
          </h1>
          <p className="text-slate mt-1">Créez de nouvelles cartes pour vos entreprises</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Configuration
          </h2>
          <div className="space-y-4">
            <Select
              label="Entreprise"
              options={enterpriseOptions}
              value={enterprise}
              onChange={setEnterprise}
              placeholder="Sélectionner une entreprise"
            />
            <Select
              label="Type de carte"
              options={cardTypeOptions}
              value={cardType}
              onChange={setCardType}
              placeholder="Sélectionner un type"
            />
            <Input
              label="Préfixe carte"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="ex: NFC-CONC-"
            />
            <Input
              label="Quantité"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
            />
            <Button fullWidth icon={<Sparkles className="w-5 h-5" />}>
              Générer les cartes
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold font-poppins text-dark mb-8">
            Aperçu de la carte
          </h3>
          <div className="w-72 h-48 rounded-2xl bg-gradient p-6 relative overflow-hidden shadow-card">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white/60 text-xs mb-1">Carte NFC</p>
              <p className="text-white font-mono text-lg">
                {prefix || 'NFC-XXX'}####
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-white/30" />
                <div className="flex gap-1">
                  <div className="w-6 h-4 rounded bg-white/30" />
                  <div className="w-6 h-4 rounded bg-white/30" />
                </div>
              </div>
            </div>
          </div>
          {enterprise && cardType && (
            <p className="mt-6 text-sm text-slate">
              {quantity} cartes seront générées pour {enterprises.find(e => e.id === enterprise)?.name}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GenerateCardsPage;
