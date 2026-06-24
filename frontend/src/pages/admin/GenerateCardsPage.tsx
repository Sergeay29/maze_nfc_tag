import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CreditCard, CheckCircle } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getEnterprises, generateCards } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';

const CARD_TYPE_OPTIONS = [
  { value: 'Loyalty', label: 'Fidélité' },
  { value: 'VIP', label: 'VIP' },
  { value: 'Business', label: 'Business' },
  { value: 'Client', label: 'Client' },
];

const GenerateCardsPage: React.FC = () => {
  const [enterprise, setEnterprise] = useState('');
  const [cardType, setCardType] = useState('');
  const [prefix, setPrefix] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ generated: number } | null>(null);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const result = await getEnterprises({ limit: 100, status: 'active' });
        setEnterprises(result.data);
      } catch {
        // fail silently — on affiche une erreur inline si vide
      } finally {
        setEnterprisesLoading(false);
      }
    };
    fetchEnterprises();
  }, []);

  const enterpriseOptions = enterprises.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const selectedEnterprise = enterprises.find((e) => e.id === enterprise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enterprise || !cardType || !prefix.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      setError("La quantité doit être entre 1 et 1000.");
      return;
    }

    try {
      setLoading(true);
      const result = await generateCards({
        enterpriseId: enterprise,
        type: cardType as 'Loyalty' | 'VIP' | 'Business' | 'Client',
        prefix: prefix.trim(),
        quantity: qty,
      });
      setSuccess(result);
      // Reset partiel après succès
      setPrefix('');
      setQuantity('100');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setLoading(false);
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
            Générer des cartes NFC
          </h1>
          <p className="text-slate mt-1">Créez de nouvelles cartes pour vos entreprises</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>{success.generated} carte{success.generated > 1 ? 's' : ''}</strong> générée{success.generated > 1 ? 's' : ''} avec succès.{' '}
            <button
              onClick={() => navigate('/admin/nfc-cards')}
              className="underline hover:no-underline font-medium"
            >
              Voir la liste
            </button>
          </span>
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
            Configuration
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Select
              label="Entreprise *"
              options={enterprisesLoading ? [{ value: '', label: 'Chargement...' }] : enterpriseOptions}
              value={enterprise}
              onChange={setEnterprise}
              placeholder="Sélectionner une entreprise"
            />
            <Select
              label="Type de carte *"
              options={CARD_TYPE_OPTIONS}
              value={cardType}
              onChange={setCardType}
              placeholder="Sélectionner un type"
            />
            <Input
              label="Préfixe carte *"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="ex: NFC-CONC-"
            />
            <Input
              label="Quantité (max 1000)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min={1}
              max={1000}
            />
            <Button
              type="submit"
              fullWidth
              icon={<Sparkles className="w-5 h-5" />}
              disabled={loading}
            >
              {loading ? 'Génération...' : 'Générer les cartes'}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold font-poppins text-dark mb-8">
            Aperçu de la carte
          </h3>
          <div className="w-72 h-48 rounded-2xl bg-gradient p-6 relative overflow-hidden shadow-card">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="absolute top-4 left-6">
              <p className="text-white/80 text-xs font-medium">
                {selectedEnterprise?.name ?? 'Entreprise'}
              </p>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white/60 text-xs mb-1">Carte NFC — {cardType || 'Type'}</p>
              <p className="text-white font-mono text-lg tracking-wider">
                {prefix ? `${prefix}0001` : 'NFC-XXX-0001'}
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
            <p className="mt-6 text-sm text-slate text-center">
              <strong>{quantity}</strong> carte{Number(quantity) > 1 ? 's' : ''} seront générées
              {selectedEnterprise ? ` pour ${selectedEnterprise.name}` : ''}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GenerateCardsPage;
