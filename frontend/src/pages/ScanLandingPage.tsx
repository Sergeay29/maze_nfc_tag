import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle2, Loader2, Phone, Mail, User, X } from 'lucide-react';
import { icons } from "../utils/iconMapper";

interface Service {
  id: string;
  name: string;
  description: string;
  pointsToAdd: number;
  icon: string | null;
  color: string;
}

interface CardInfo {
  card: {
    id: string;
    cardCode: string;
    cardNumber: string;
    type: string;
    subtype?: string;
  };
  enterprise: {
    id: string;
    name: string;
    logo: string | null;
    location: string | null;
    phone: string | null;
  };
  services: Service[];
}

interface ScanResult {
  pointsAdded: number;
  totalPoints: number;
  level: string;
  service: {
    name: string;
    icon: string | null;
  };
  client: {
    id: string;
    name: string;
    points: number;
    level: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ScanLandingPage: React.FC = () => {
  const { token, enterpriseSlug, cardType } = useParams<{
    token: string;
    enterpriseSlug?: string;
    cardType?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);


  // Formulaire client
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clientIdentified, setClientIdentified] = useState(false);

  // Service sélectionné
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cardCodeInput, setCardCodeInput] = useState('');

  // Charger les informations de la carte
  useEffect(() => {
    if (!token) {
      setError('Lien invalide');
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/scan/card/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCardInfo(data.data);
        } else {
          setError(data.message || 'Carte introuvable');
        }
      })
      .catch((err) => {
        console.error('Error fetching card info:', err);
        setError('Erreur de connexion');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);


  // Identifier le client
  const handleIdentifyClient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone && !email) {
      setError('Veuillez fournir un téléphone ou un email');
      return;
    }

    setClientIdentified(true);
    setError(null);
  };

  // Sélectionner un service et ouvrir le modal
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setShowModal(true);
    setCardCodeInput('');
    setError(null);
  };



  // Valider le scan avec cardCode
  const handleValidateScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardCodeInput) {
      setError('Veuillez saisir le code de la carte');
      return;
    }

    if (!selectedService) {
      setError('Service non sélectionné');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/scan/validate-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanToken: token,
          cardCode: cardCodeInput.trim().toUpperCase(),
          serviceId: selectedService.id,
          phone: phone || undefined,
          email: email || undefined,
          name: name || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
        setShowModal(false);
      } else {
        setError(data.message || 'Erreur lors du scan');
      }
    } catch (err) {
      console.error('Validate scan error:', err);
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error && !cardInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oups !</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  // Résultat du scan (succès)
  if (scanResult) {
    const ScanIcon = scanResult.service.icon
      ? icons[scanResult.service.icon]
      : null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bravo !</h2>

          <div className="my-6">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                {ScanIcon && (
                  <ScanIcon className="w-8 h-8 text-white" />
                )}
                <p className="text-lg font-medium">{scanResult.service.name}</p>
              </div>
              <p className="text-5xl font-bold">+{scanResult.pointsAdded}</p>
              <p className="text-sm opacity-90">points</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total de points</span>
              <span className="text-2xl font-bold text-purple-600">{scanResult.totalPoints}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Niveau</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-sm font-semibold">
                <Star className="w-4 h-4" />
                {scanResult.level}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Merci {scanResult.client.name} ! Continuez à accumuler des points pour débloquer des récompenses exclusives.
          </p>
        </div>
      </div>
    );
  }

  // Page principale de scan
  const SelectedIcon = selectedService?.icon
    ? icons[selectedService.icon]
    : null;
  return (

    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        {/* Header avec logo entreprise */}
        <div
          className="relative h-48 flex flex-col items-center justify-center text-white p-6"
          style={{
            backgroundColor: '#6A35FF',
            background: 'linear-gradient(135deg, #6A35FF 0%, #6A35FFdd 100%)'
          }}
        >
          {cardInfo?.enterprise.logo ? (
            <img
              src={cardInfo.enterprise.logo}
              alt={cardInfo.enterprise.name}
              className="w-24 h-24 rounded-full bg-white p-2 mb-4 shadow-lg object-contain"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <span className="text-4xl font-bold">{cardInfo?.enterprise.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-center">{cardInfo?.enterprise.name}</h1>
          {cardInfo?.enterprise.location && (
            <p className="text-sm opacity-90 mt-1">{cardInfo.enterprise.location}</p>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Identification client */}
          {!clientIdentified ? (
            <form onSubmit={handleIdentifyClient} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Identifier le client</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="text-center text-sm text-gray-500">ou</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nom (optionnel)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
              >
                Continuer
              </button>
            </form>
          ) : (
            <>
                {/* Client identifié */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Client: {name || phone || email}
                  </span>
                </div>
              </div>

              {/* Liste des services */}
              <h2 className="text-lg font-bold text-gray-800 mb-4">Sélectionner un service</h2>

              {cardInfo?.services && cardInfo.services.length > 0 ? (
                <div className="space-y-3">
                    {/* {cardInfo.services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl p-4 transition-all border-2 border-transparent hover:border-purple-300 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {ServiceIcon && (
                            <ServiceIcon className="w-8 h-8 text-purple-600" />
                          )}
                          <div>
                            <h3 className="font-bold text-gray-800">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-gray-600">{service.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">+{service.pointsToAdd}</div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>
                    </button>
                  ))} */}

                    {cardInfo?.services.map((service) => {
                      const ServiceIcon = service.icon ? icons[service.icon] : null;

                      return (
                        <button
                          key={service.id}
                          onClick={() => handleSelectService(service)}
                          className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl p-4 transition-all border-2 border-transparent hover:border-purple-300 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">

                            {ServiceIcon && (
                              <ServiceIcon className="w-8 h-8 text-purple-600" />
                            )}
                            <div>
                              <h3 className="font-bold text-gray-800">{service.name}</h3>
                              {service.description && (
                                <p className="text-sm text-gray-600">{service.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">+{service.pointsToAdd}</div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun service disponible pour le moment
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmation avec cardCode */}
      {showModal && selectedService && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Confirmer le service</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                {SelectedIcon && (
                  <SelectedIcon className="w-8 h-8 text-purple-600" />
                )}
                <div>
                  <h4 className="font-bold text-gray-800">{selectedService.name}</h4>
                  <p className="text-sm text-gray-600">+{selectedService.pointsToAdd} points</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Client: {name || phone || email}</p>
            </div>

            <form onSubmit={handleValidateScan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔑 Code de la carte physique
                </label>
                <input
                  type="text"
                  value={cardCodeInput}
                  onChange={(e) => setCardCodeInput(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-lg"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Vérifiez le code sur la carte présentée
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '✓ Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanLandingPage;
