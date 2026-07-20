import React, { useState } from 'react';
import { ArrowLeft, Package, CheckCircle, Hash } from 'lucide-react';
import { Button, Input, Card } from '../../components';
import { useNavigate } from 'react-router-dom';
import { generateStockCards } from '../../api/adminApi';

const GenerateStockPage: React.FC = () => {
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ generated: number; batchId: string } | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 5000) {
      setError('La quantité doit être entre 1 et 5000.');
      return;
    }

    try {
      setLoading(true);
      const result = await generateStockCards({ quantity: qty });
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-cloud transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Générer du stock global</h1>
          <p className="text-slate mt-1">
            Créez des cartes NFC vierges dans le stock Maze — le type sera attribué lors de l'assignation à une entreprise
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">{success.generated} carte(s) vierge(s) ajoutée(s) au stock</p>
            <p className="text-sm font-mono text-green-600">Lot : {success.batchId}</p>
            <p className="text-sm text-green-700/80">
              Ces cartes n'ont pas encore de type. Celui-ci sera choisi lors de l'assignation à une entreprise.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate('/admin/stock')}
                className="text-sm underline hover:no-underline font-medium"
              >
                Voir le stock →
              </button>
              <button
                onClick={() => navigate('/admin/stock/assign')}
                className="text-sm underline hover:no-underline font-medium"
              >
                Assigner à une entreprise →
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <Card>
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Configuration du lot</h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <Input
              label="Quantité (max 5000)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min={1}
              max={5000}
            />

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 space-y-2">
              <p className="font-semibold">ℹ️ Comment fonctionne le stock global ?</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700/90">
                <li>Vous générez ici des <strong>cartes vierges</strong> (sans type ni sous-type)</li>
                <li>Via "Assigner un lot", vous choisissez une entreprise, un type et une quantité</li>
                <li>Les cartes reçoivent alors leur type, leur numéro final et leur URL de scan</li>
                <li>L'entreprise peut ensuite les activer en les attribuant à ses clients</li>
              </ol>
            </div>

            <Button
              type="submit"
              fullWidth
              icon={<Package className="w-5 h-5" />}
              disabled={loading}
            >
              {loading ? 'Génération...' : 'Créer le lot de stock'}
            </Button>
          </form>
        </Card>

        {/* Aperçu */}
        <Card className="flex flex-col">
          <h2 className="text-lg font-semibold font-poppins text-dark mb-6">Aperçu du lot</h2>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
            {/* Carte d'aperçu */}
            <div className="w-64 h-40 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 p-5 relative overflow-hidden shadow-lg">
              <div className="absolute top-3 left-5">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Stock Maze</p>
              </div>
              <div className="absolute top-3 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-white/60" />
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-white/40 text-xs mb-1 italic">Type : à définir à l'assignation</p>
                <p className="text-white font-mono text-base tracking-wider">STK-000001</p>
              </div>
            </div>

            {/* Récap */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                <div className="flex items-center gap-2 text-slate text-sm">
                  <Hash className="w-4 h-4" />
                  <span>Cartes à créer</span>
                </div>
                <span className="font-bold text-dark">{parseInt(quantity) || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                <span className="text-slate text-sm">Type</span>
                <span className="text-slate italic text-sm">À attribuer lors de l'assignation</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                <span className="text-slate text-sm">Sous-type</span>
                <span className="text-slate italic text-sm">À attribuer lors de l'assignation</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                <span className="text-slate text-sm">Statut initial</span>
                <span className="text-amber-600 font-medium text-sm">En stock (vierge)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cloud rounded-xl">
                <span className="text-slate text-sm">Entreprise</span>
                <span className="text-slate italic text-sm">À assigner ultérieurement</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GenerateStockPage;
