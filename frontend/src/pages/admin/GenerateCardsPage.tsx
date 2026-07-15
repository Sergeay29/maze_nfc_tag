import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CreditCard, CheckCircle } from 'lucide-react';
import { Button, Input, Select, Card } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getEnterprises, generateCards, getCardTypes, getEnterpriseServices, type AdminService } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';
import type { CardTypeData } from '../../api/adminApi';
import { getCardPrefix } from '../../utils/cardUtils';


const GenerateCardsPage: React.FC = () => {
  const [enterprise, setEnterprise] = useState('');
  const [cardTypeId, setCardTypeId] = useState('');
  const [cardSubtype, setCardSubtype] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ generated: number; scanUrl?: string } | null>(null);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(true);
  const [cardTypes, setCardTypes] = useState<CardTypeData[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enterprisesResult, typesResult] = await Promise.all([
          getEnterprises({ limit: 100, status: 'active' }),
          getCardTypes(),
        ]);
        setEnterprises(enterprisesResult.data);
        setCardTypes(typesResult);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
      finally { setEnterprisesLoading(false); }
    };
    fetchData();
  }, []);

  // Charger les services lorsqu'une entreprise est sélectionnée
  useEffect(() => {
    if (!enterprise) {
      setServices([]);
      setServiceId('');
      return;
    }

    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const servicesData = await getEnterpriseServices(enterprise);
        setServices(servicesData);
        // Sélectionner automatiquement le premier service s'il existe
        if (servicesData.length > 0) {
          setServiceId(servicesData[0].id);
        }
      } catch (err) {
        console.error('Erreur chargement services:', err);
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterprise]);

  const enterpriseOptions = enterprises.map((e) => ({ value: e.id, label: e.name }));
  const selectedEnterprise = enterprises.find((e) => e.id === enterprise);
  const selectedCardType = cardTypes.find((t) => t.id === cardTypeId);
  const cardTypeOptions = cardTypes.map(t => ({ value: t.id, label: t.type || 'Type inconnu' }));
  
  const serviceOptions = services.map(s => ({ value: s.id, label: `${s.name} (${s.pointsToAdd} pts)` }));
  const selectedService = services.find(s => s.id === serviceId);

  const handleEnterpriseChange = (value: string) => {
    setEnterprise(value);
    setServiceId(''); // Réinitialiser le service quand on change d'entreprise
  };

  const handleCardTypeChange = (value: string) => {
    setCardTypeId(value);
    setCardSubtype('');
  };

  const getMockPrefix = () => {
    if (!selectedEnterprise || !selectedCardType) return 'ENT-TYP';
    return getCardPrefix(selectedEnterprise.name, selectedCardType.type, cardSubtype);
  };

  const previewTypeText = selectedCardType ? selectedCardType.type : 'Type';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enterprise || !cardTypeId) {
      setError("Veuillez sélectionner une entreprise et un type de carte.");
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
        cardTypeId,
        subtype: cardSubtype || undefined,
        serviceId: serviceId || undefined,
        quantity: qty,
      });
      setSuccess(result);
      setQuantity('100');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER & ALERTS */}
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
          <div className="flex-1">
            <span><strong>{success.generated} carte(s)</strong> générée(s) avec succès.{' '}
              <button onClick={() => navigate('/admin/nfc-cards')} className="underline hover:no-underline font-medium">Voir la liste</button>
            </span>
            {success.scanUrl && (
              <p className="text-xs mt-1 text-green-600">URL générée: {success.scanUrl}</p>
            )}
          </div>
        </div>
      )}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULAIRE */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Configuration</h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Select 
              label="Entreprise *" 
              options={enterprisesLoading ? [{ value: '', label: 'Chargement...' }] : enterpriseOptions} 
              value={enterprise} 
              onChange={handleEnterpriseChange} 
              placeholder="Sélectionner une entreprise" 
            />

            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Type de carte *" 
                options={cardTypeOptions} 
                value={cardTypeId} 
                onChange={handleCardTypeChange} 
                placeholder="Sélectionner un type" 
              />
              {(selectedCardType?.subtypes || []).length > 0 && (
                <Select
                  label="Sous-type (optionnel)"
                  options={[
                    { value: '', label: 'Aucun' },
                    ...(selectedCardType?.subtypes || []).map(subtype => ({ value: subtype, label: subtype }))
                  ]}
                  value={cardSubtype}
                  onChange={setCardSubtype}
                  placeholder="Sélectionner un sous-type"
                />
              )}
            </div>

            {enterprise && (
              <div className="space-y-2">
                <Select
                  label="Service (optionnel)"
                  options={servicesLoading ? [{ value: '', label: 'Chargement...' }] : [{ value: '', label: 'Aucun service' }, ...serviceOptions]}
                  value={serviceId}
                  onChange={setServiceId}
                  placeholder="Sélectionner un service"
                  disabled={servicesLoading}
                />
                <p className="text-xs text-slate-600">
                  Laissez vide pour générer des cartes sans service ni lien de scan associé.
                </p>
              </div>
            )}

            {selectedService && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                <p className="font-medium">Service sélectionné : {selectedService.name}</p>
                <p className="text-xs mt-1">Points par scan : {selectedService.pointsToAdd} pts</p>
                {selectedService.scanToken && (
                  <p className="text-xs mt-1 font-mono truncate">Token : {selectedService.scanToken.substring(0, 16)}...</p>
                )}
              </div>
            )}

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
              disabled={loading || !enterprise || !cardTypeId}
            >
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
              <p className="text-white/60 text-xs mb-1">
                Carte NFC — {previewTypeText}
                {cardSubtype ? ` (${cardSubtype})` : ''}
              </p>
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
          <div className="mt-6 text-center space-y-2">
            {enterprise && cardTypeId && (
              <p className="text-sm text-slate">
                <strong>{quantity}</strong> carte{Number(quantity) > 1 ? 's' : ''} seront générées
              </p>
            )}
            {selectedService && (
              <p className="text-xs text-purple-600">
                Service : {selectedService.name}
              </p>
            )}
            {success?.scanUrl && (
              <p className="text-xs text-green-600 max-w-[280px] truncate">
                URL: {success.scanUrl}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GenerateCardsPage;
