import React, { useState } from 'react';
import { ArrowLeft, User, CreditCard, Phone, Mail, Award } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components';
import { nfcCards } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const CardAttributionPage: React.FC = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('');
  const navigate = useNavigate();

  const unassignedCards = nfcCards.filter((c) => c.status === 'unassigned');
  const cardOptions = unassignedCards.map((c) => ({
    value: c.number,
    label: c.number,
  }));

  const levelOptions = [
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' },
  ];

  const selectedCard = nfcCards.find((c) => c.number === cardNumber);

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
            Attribution de carte
          </h1>
          <p className="text-slate mt-1">Attribuez une carte NFC à un client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Informations client
          </h2>
          <div className="space-y-4">
            <Select
              label="Numéro de carte"
              options={cardOptions}
              value={cardNumber}
              onChange={setCardNumber}
              placeholder="Sélectionner une carte"
            />
            <Input
              label="Nom du client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Jean Dupont"
              icon={<User className="w-5 h-5" />}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@email.com"
              icon={<Mail className="w-5 h-5" />}
            />
            <Input
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              icon={<Phone className="w-5 h-5" />}
            />
            <Select
              label="Niveau client"
              options={levelOptions}
              value={level}
              onChange={setLevel}
              placeholder="Sélectionner un niveau"
            />
            <Button fullWidth icon={<CreditCard className="w-5 h-5" />}>
              Attribuer la carte
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Profil client
          </h2>
          {clientName ? (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient flex items-center justify-center mb-4">
                <span className="text-white text-3xl font-bold font-poppins">
                  {clientName.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-semibold font-poppins text-dark mb-1">
                {clientName}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-slate font-medium">
                  {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Niveau non défini'}
                </span>
              </div>

              <div className="bg-cloud rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate">Points actuels</span>
                  <span className="font-semibold text-dark">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Carte liée</span>
                  <span className="font-mono text-primary text-sm">
                    {cardNumber || 'Non attribuée'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Statut</span>
                  <span className="text-green-500 font-medium">Actif</span>
                </div>
              </div>

              {selectedCard && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-sm text-slate">
                    Cette carte appartient à <strong>{selectedCard.enterpriseName}</strong>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate">
              <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Renseignez les informations du client pour voir l'aperçu</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CardAttributionPage;
