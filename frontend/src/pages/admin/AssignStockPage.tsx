import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Package, CheckCircle, ChevronRight, Hash } from 'lucide-react';
import { Button, Select, Card, StatCard } from '../../components';
import { useNavigate } from 'react-router-dom';
import {
  getEnterprises,
  getGlobalStock,
  getCardTypes,
  assignStockToEnterprise,
} from '../../api/adminApi';
import type { GlobalStockData, CardTypeData } from '../../api/adminApi';
import type { Enterprise } from '../../data/mockData';

const AssignStockPage: React.FC = () => {
  const navigate = useNavigate();

  const [enterpriseId, setEnterpriseId] = useState('');
  const [cardTypeId, setCardTypeId] = useState('');
  const [subtype, setSubtype] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(''); // optionnel : assigner un lot spécifique

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [globalStock, setGlobalStock] = useState<GlobalStockData | null>(null);
  const [cardTypes, setCardTypes] = useState<CardTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ assigned: number; enterpriseName: string; type: string; subtype?: string } | null>(null);

  useEffect(() => {
    Promise.all([
      getEnterprises({ limit: 200, status: 'active' }),
      getGlobalStock(),
      getCardTypes(),
    ])
      .then(([entRes, stockRes, typesRes]) => {
        setEnterprises(entRes.data);
        setGlobalStock(stockRes);
        setCardTypes(typesRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshStock = () => {
    getGlobalStock().then(setGlobalStock).catch(console.error);
  };

  const enterpriseOptions = enterprises.map((e) => ({ value: e.id, label: e.name }));
  const cardTypeOptions = cardTypes.map((t) => ({ value: t.id, label: t.type }));
  const selectedType = cardTypes.find((t) => t.id === cardTypeId);

  const handleTypeChange = (val: string) => {
    setCardTypeId(val);
    setSubtype('');
  };

  const totalAvailable = globalStock?.total ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enterpriseId) { setError("Veuillez sélectionner une entreprise."); return; }
    if (!cardTypeId) { setError("Veuillez sélectionner un type de carte."); return; }

    // On doit avoir soit un batchId, soit une quantité
    if (!selectedBatchId) {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty < 1) { setError("Veuillez indiquer une quantité valide."); return; }
      if (qty > totalAvailable) {
        setError(`Stock insuffisant : seulement ${totalAvailable} carte(s) disponible(s).`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = selectedBatchId
        ? { enterpriseId, cardTypeId, subtype: subtype || undefined, batchId: selectedBatchId }
        : { enterpriseId, cardTypeId, subtype: subtype || undefined, quantity: parseInt(quantity) };

      const result = await assignStockToEnterprise(payload);
      setSuccess({
        assigned: result.assigned,
        enterpriseName: result.enterpriseName,
        type: result.type,
        subtype: result.subtype,
      });
      setEnterpriseId('');
      setCardTypeId('');
      setSubtype('');
      setQuantity('');
      setSelectedBatchId('');
      refreshStock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'assignation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-cloud transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Assigner un stock à une entreprise</h1>
          <p className="text-slate mt-1">
            Choisissez l'entreprise, le type et la quantité — les cartes vierges recevront leur type ici
          </p>
        </div>
      </div>

      {/* Stats stock global */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Stock global disponible"
          value={totalAvailable.toLocaleString('fr-FR')}
          icon={<Package className="w-5 h-5" />}
          gradient
        />
        <StatCard
          title="Lots en attente"
          value={(globalStock?.byBatch.length ?? 0).toLocaleString('fr-FR')}
          icon={<Hash className="w-5 h-5" />}
        />
        <StatCard
          title="Types de cartes"
          value={cardTypes.length.toLocaleString('fr-FR')}
          icon={<Building2 className="w-5 h-5" />}
        />
      </div>

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {success.assigned} carte(s) assignée(s) à <strong>{success.enterpriseName}</strong>
            </p>
            <p className="text-sm mt-1">
              Type attribué : <strong>{success.type}</strong>
              {success.subtype && <> · Sous-type : <strong>{success.subtype}</strong></>}
            </p>
            <p className="text-sm text-green-700/80 mt-1">
              Les cartes ont reçu leur numéro final et sont maintenant disponibles dans l'espace de l'entreprise.
            </p>
            <button
              onClick={() => navigate('/admin/nfc-cards')}
              className="text-sm underline hover:no-underline font-medium mt-2 block"
            >
              Voir les cartes →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Paramètres d'assignation</h2>

          {totalAvailable === 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              Le stock est vide.{' '}
              <button onClick={() => navigate('/admin/stock/generate')} className="font-medium underline hover:no-underline">
                Générer du stock →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Entreprise */}
            <Select
              label="Entreprise *"
              options={enterpriseOptions}
              value={enterpriseId}
              onChange={setEnterpriseId}
              placeholder="Sélectionner une entreprise"
            />

            {/* Type de carte — attribué maintenant */}
            <Select
              label="Type de carte *"
              options={cardTypeOptions}
              value={cardTypeId}
              onChange={handleTypeChange}
              placeholder="Sélectionner un type"
            />

            {/* Sous-type si disponible */}
            {(selectedType?.subtypes ?? []).length > 0 && (
              <Select
                label="Sous-type (optionnel)"
                options={[
                  { value: '', label: 'Aucun' },
                  ...(selectedType?.subtypes ?? []).map((s) => ({ value: s, label: s })),
                ]}
                value={subtype}
                onChange={setSubtype}
                placeholder="Sélectionner un sous-type"
              />
            )}

            {/* Lot spécifique ou quantité */}
            {(globalStock?.byBatch ?? []).length > 0 && (
              <Select
                label="Lot spécifique (optionnel)"
                options={[
                  { value: '', label: "Prendre dans le stock (FIFO)" },
                  ...(globalStock?.byBatch ?? []).map((b) => ({
                    value: b.batchId,
                    label: `${b.batchId} — ${b.count} cartes`,
                  })),
                ]}
                value={selectedBatchId}
                onChange={setSelectedBatchId}
                placeholder="Lot automatique"
              />
            )}

            {/* Quantité — masquée si un lot spécifique est sélectionné */}
            {!selectedBatchId && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-dark">
                  Quantité * {totalAvailable > 0 && (
                    <span className="text-slate font-normal">({totalAvailable} disponible{totalAvailable > 1 ? 's' : ''})</span>
                  )}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 50"
                  min={1}
                  max={totalAvailable || undefined}
                  className="w-full px-4 py-3 bg-cloud border border-slate/20 rounded-xl text-dark focus:outline-none focus:border-primary transition-colors"
                />
                {quantity && parseInt(quantity) > totalAvailable && totalAvailable > 0 && (
                  <p className="text-red-600 text-xs">Quantité supérieure au stock disponible</p>
                )}
              </div>
            )}

            {selectedBatchId && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                <p className="font-medium text-dark">
                  {globalStock?.byBatch.find((b) => b.batchId === selectedBatchId)?.count ?? 0} cartes seront assignées
                </p>
                <p className="text-slate text-xs mt-0.5">Lot complet : {selectedBatchId}</p>
              </div>
            )}

            {/* Récap de ce qui va être attribué */}
            {cardTypeId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 space-y-0.5">
                <p className="font-medium">Les cartes recevront :</p>
                <p>• Type : <strong>{selectedType?.type}</strong></p>
                {subtype && <p>• Sous-type : <strong>{subtype}</strong></p>}
                <p>• Un numéro au format : <code className="font-mono">
                  {enterpriseId
                    ? `${enterprises.find(e => e.id === enterpriseId)?.name?.substring(0, 4).toUpperCase() ?? 'ENT'}-${selectedType?.type?.substring(0, 3).toUpperCase() ?? 'TYP'}-0001`
                    : 'ENT-TYP-0001'
                  }
                </code></p>
                <p>• Une URL de scan générée automatiquement</p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              icon={<ChevronRight className="w-5 h-5" />}
              disabled={submitting || totalAvailable === 0}
            >
              {submitting ? 'Assignation en cours...' : "Assigner au stock de l'entreprise"}
            </Button>
          </form>
        </Card>

        {/* Lots disponibles */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-4">Lots en stock</h2>
          {(globalStock?.byBatch ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate gap-3">
              <Package className="w-10 h-10 opacity-30" />
              <p className="text-sm">Aucun lot en stock</p>
              <button
                onClick={() => navigate('/admin/stock/generate')}
                className="text-sm text-primary underline hover:no-underline"
              >
                Générer du stock →
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {globalStock?.byBatch.map((b) => (
                <div
                  key={b.batchId}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedBatchId === b.batchId
                      ? 'border-primary bg-primary/5'
                      : 'border-cloud hover:border-slate/30'
                  }`}
                  onClick={() => setSelectedBatchId(selectedBatchId === b.batchId ? '' : b.batchId)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-slate truncate">{b.batchId}</p>
                        <p className="text-xs text-slate/70 italic">cartes vierges</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-dark">{b.count}</p>
                      <p className="text-xs text-slate">cartes</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate mt-1 ml-11">
                    Créé le {new Date(b.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Info pédagogique */}
          <div className="mt-4 pt-4 border-t border-slate/10 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Rappel du flux</p>
            <p>1. Les lots ne contiennent que des cartes <strong>vierges</strong> (sans type)</p>
            <p>2. Le type est choisi <strong>ici</strong> au moment d'assigner à une entreprise</p>
            <p>3. Une fois assignées, les cartes ont un numéro et une URL de scan</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AssignStockPage;
