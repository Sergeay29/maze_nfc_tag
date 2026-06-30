import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CreditCard, CheckCircle, Link } from 'lucide-react'; // Ajout de l'icône Link
import { Button, Input, Select, Card } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getEnterprises, generateCards } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';
import { CardType } from '../../@types/types';

const CARD_TYPE_OPTIONS = [
  { value: 'Fidélité Entreprise', label: 'Fidélité Entreprise' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Carte de visite', label: 'Carte de visite' },
];

const CARD_SUBTYPE_OPTIONS = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Luxe', label: 'Luxe' },
];


const GenerateCardsPage: React.FC = () => {
  const [enterprise, setEnterprise] = useState('');
  const [cardType, setCardType] = useState<CardType | ''>('');
  const [cardSubtype, setCardSubtype] = useState('');
  const [scanBaseUrl, setScanBaseUrl] = useState(''); // NOUVEAU : Remplace le préfixe
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
      } catch { }
      finally { setEnterprisesLoading(false); }
    };
    fetchEnterprises();
  }, []);

  const enterpriseOptions = enterprises.map((e) => ({ value: e.id, label: e.name }));
  const selectedEnterprise = enterprises.find((e) => e.id === enterprise);
  const showSubtype = cardType === 'Restaurant';

  const handleCardTypeChange = (value: CardType) => {
    setCardType(value);
    setCardSubtype('');
  };

  // Utilitaire pour simuler l'aperçu du cardNumber (comme le fait le backend)
  const slugify = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').toLowerCase();
  const getMockPrefix = () => {
    let p = `${slugify(selectedEnterprise?.name || 'entreprise')}-${slugify(cardType || 'type')}`;
    if (showSubtype && cardSubtype) p += `-${slugify(cardSubtype)}`;
    return p;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enterprise || !cardType || !scanBaseUrl.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (showSubtype && !cardSubtype) {
      setError("Veuillez sélectionner un sous-type.");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      setError("La quantité doit être entre 1 et 1000.");
      return;
    }

    try {
      setLoading(true);
      await generateCards({
        enterpriseId: enterprise,
        type: cardType,
        subtype: cardSubtype,
        scanBaseUrl: scanBaseUrl.trim(),
        quantity: qty,
      });
      setSuccess({ generated: qty }); // Le backend renvoie le vrai nombre, mais on simplifie ici
      setQuantity('100');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const previewTypeText = showSubtype && cardSubtype ? `${cardType} (${cardSubtype})` : cardType || 'Type';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER & ALERTS (inchangés) */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-cloud transition-colors duration-200">
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Générer des cartes NFC</h1>
          <p className="text-slate mt-1">Créez de nouvelles cartes pour vos entreprises</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span><strong>{success.generated} carte(s)</strong> générée(s) avec succès.{' '}
            <button onClick={() => navigate('/admin/nfc-cards')} className="underline hover:no-underline font-medium">Voir la liste</button>
          </span>
        </div>
      )}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULAIRE */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Configuration</h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Select label="Entreprise *" options={enterprisesLoading ? [{ value: '', label: 'Chargement...' }] : enterpriseOptions} value={enterprise} onChange={setEnterprise} placeholder="Sélectionner une entreprise" />

            <div className="grid grid-cols-2 gap-4">
              <Select label="Type de carte *" options={CARD_TYPE_OPTIONS} value={cardType} onChange={handleCardTypeChange} placeholder="Sélectionner un type" />
              {showSubtype ? (
                <Select label="Sous-type *" options={CARD_SUBTYPE_OPTIONS} value={cardSubtype} onChange={setCardSubtype} placeholder="Sous-type" />
              ) : (
                <div /> // Placeholder pour garder la grille alignée
              )}
            </div>

            {/* NOUVEAU CHAMP URL */}
            <Input
              label="URL de base du scan *"
              icon={<Link className="w-4 h-4 text-slate" />}
              value={scanBaseUrl}
              onChange={(e) => setScanBaseUrl(e.target.value)}
              placeholder="ex: https://monapp.com/scan/"
            />
            <p className="text-xs text-slate -mt-2">Le code unique de la carte sera ajouté à la fin de cette URL.</p>

            <Input label="Quantité (max 1000)" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" min={1} max={1000} />

            <Button type="submit" fullWidth icon={<Sparkles className="w-5 h-5" />} disabled={loading}>
              {loading ? 'Génération...' : 'Générer les cartes'}
            </Button>
          </form>
        </Card>

        {/* APERÇU */}
        <Card className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold font-poppins text-dark mb-8">Aperçu de la carte</h3>
          <div className="w-72 h-48 rounded-2xl bg-gradient p-6 relative overflow-hidden shadow-card">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="absolute top-4 left-6">
              <p className="text-white/80 text-xs font-medium">{selectedEnterprise?.name ?? 'Entreprise'}</p>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white/60 text-xs mb-1">Carte NFC — {previewTypeText}</p>
              {/* Affichage dynamique du numéro généré */}
              <p className="text-white font-mono text-lg tracking-wider">
                {enterprise ? `${getMockPrefix()}-0001` : 'entreprise-type-0001'}
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
          <div className="mt-6 text-center">
            {enterprise && cardType && (!showSubtype || cardSubtype) && (
              <p className="text-sm text-slate">
                <strong>{quantity}</strong> carte{Number(quantity) > 1 ? 's' : ''} seront générées
              </p>
            )}
            {scanBaseUrl && (
              <p className="text-xs text-slate mt-2 max-w-[250px] truncate">
                Url: {scanBaseUrl}ABC12345
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GenerateCardsPage;