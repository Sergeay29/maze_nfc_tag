import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, CreditCard, Mail, Award, CheckCircle } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components';
import PhoneInput from '../../components/PhoneInput';
import { useNavigate } from 'react-router-dom';
import { getUnassignedCards, getEnterprises, assignCard } from '../../api/adminApi';
import type { UnassignedCard } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';

const LEVEL_OPTIONS = [
  { value: 'Silver', label: 'Silver' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Platinum', label: 'Platinum' },
];

const CardAttributionPage: React.FC = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('Silver');
  const [enterpriseId, setEnterpriseId] = useState('');

  const [cards, setCards] = useState<UnassignedCard[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [enterprisesLoading, setEnterprisesLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Charger les entreprises au montage
  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getEnterprises({ limit: 100, status: 'active' });
        setEnterprises(result.data);
      } catch {
        // fail silently
      } finally {
        setEnterprisesLoading(false);
      }
    };
    fetch();
  }, []);

  // Charger les cartes non attribuées quand l'entreprise change
  useEffect(() => {
    if (!enterpriseId) {
      setCards([]);
      setCardNumber('');
      return;
    }
    const fetch = async () => {
      try {
        setCardsLoading(true);
        setCardNumber('');
        const result = await getUnassignedCards(enterpriseId);
        setCards(result);
      } catch {
        setCards([]);
      } finally {
        setCardsLoading(false);
      }
    };
    fetch();
  }, [enterpriseId]);

  const enterpriseOptions = enterprises.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const cardOptions = cardsLoading
    ? [{ value: '', label: 'Chargement...' }]
    : cards.length === 0
    ? [{ value: '', label: 'Aucune carte disponible' }]
    : cards.map((c) => ({ value: c.cardNumber, label: c.cardNumber }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!cardNumber || !clientName.trim() || !enterpriseId) {
      setError("Veuillez remplir : entreprise, carte et nom du client.");
      return;
    }

    try {
      setSubmitting(true);
      await assignCard({
        cardNumber,
        clientName: clientName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        level: level as 'Silver' | 'Gold' | 'Platinum',
        enterpriseId,
      });
      setSuccess(true);
      // Reset
      setCardNumber('');
      setClientName('');
      setEmail('');
      setPhone('');
      setLevel('Silver');
      // Recharger les cartes disponibles
      const refreshed = await getUnassignedCards(enterpriseId);
      setCards(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'attribution");
    } finally {
      setSubmitting(false);
    }
  };

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

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Carte attribuée avec succès au client.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Informations client
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Select
              label="Entreprise *"
              options={
                enterprisesLoading
                  ? [{ value: '', label: 'Chargement...' }]
                  : enterpriseOptions
              }
              value={enterpriseId}
              onChange={setEnterpriseId}
              placeholder="Sélectionner une entreprise"
            />
            <Select
              label="Numéro de carte *"
              options={cardOptions}
              value={cardNumber}
              onChange={setCardNumber}
              placeholder="Sélectionner une carte"
            />
            <Input
              label="Nom du client *"
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
            <PhoneInput
              label="Téléphone"
              value={phone}
              onChange={setPhone}
            />
            <Select
              label="Niveau client"
              options={LEVEL_OPTIONS}
              value={level}
              onChange={setLevel}
            />
            <Button
              type="submit"
              fullWidth
              icon={<CreditCard className="w-5 h-5" />}
              disabled={submitting}
            >
              {submitting ? 'Attribution...' : 'Attribuer la carte'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">
            Aperçu client
          </h2>
          {clientName ? (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient flex items-center justify-center mb-4">
                <span className="text-white text-3xl font-bold font-poppins">
                  {clientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold font-poppins text-dark mb-1">
                {clientName}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-slate font-medium">{level}</span>
              </div>

              <div className="bg-cloud rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate">Points initiaux</span>
                  <span className="font-semibold text-dark">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Carte liée</span>
                  <span className="font-mono text-primary text-sm">
                    {cardNumber || 'Non sélectionnée'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Statut</span>
                  <span className="text-green-500 font-medium">Actif</span>
                </div>
                {enterpriseId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Entreprise</span>
                    <span className="text-dark font-medium text-sm">
                      {enterprises.find((e) => e.id === enterpriseId)?.name ?? '—'}
                    </span>
                  </div>
                )}
              </div>
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
