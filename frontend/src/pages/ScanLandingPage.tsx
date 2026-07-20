import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star, CheckCircle2, Loader2, Phone, Mail, User,
  X, Gift, ChevronRight, Lock, Trophy,
} from 'lucide-react';
import { icons } from '../utils/iconMapper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  description: string;
  pointsToAdd: number;
  icon: string | null;
  color: string;
}

interface Reward {
  id: string;
  title: string;
  description?: string;
  pointsRequired: number;
  image?: string;
  category?: string;
  stock?: number;
}

interface LevelInfo {
  current: string;
  next: string | null;
  nextMin: number | null;
  pointsToNext: number;
  progressToNext: number;
}

interface ClientInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  points: number;
  level: string;
  levelInfo: LevelInfo;
  availableRewards: string[];
}

interface CardInfo {
  card: { id: string; cardCode: string; cardNumber: string; type: string; subtype?: string; isAssigned: boolean };
  enterprise: { id: string; name: string; logo: string | null; location: string | null; phone: string | null };
  services: Service[];
  rewards: Reward[];
  client: ClientInfo | null;
}

interface ScanResult {
  pointsAdded: number;
  totalPoints: number;
  level: string;
  levelInfo: LevelInfo;
  service: { name: string; icon: string | null };
  client: { id: string; name: string; points: number; level: string };
  rewards: Reward[];
  availableRewards: string[];
}

interface RedeemResult {
  redemptionId: string;
  pointsUsed: number;
  reward: { id: string; title: string; description?: string; image?: string };
  client: { id: string; name: string; points: number; level: string; levelInfo: LevelInfo };
  rewards: Reward[];
  availableRewards: string[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LEVEL_COLORS: Record<string, string> = {
  Silver: 'from-gray-400 to-gray-500',
  Gold: 'from-yellow-400 to-orange-400',
  Platinum: 'from-purple-500 to-indigo-500',
};

const LEVEL_ICONS: Record<string, string> = {
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

const ClientBalanceCard: React.FC<{
  client: ClientInfo;
  rewards: Reward[];
  onRedeemReward: (reward: Reward) => void;
}> = ({ client, rewards, onRedeemReward }) => {
  const { levelInfo } = client;
  const available = rewards.filter((r) => client.availableRewards.includes(r.id));
  const locked = rewards.filter((r) => !client.availableRewards.includes(r.id));

  return (
    <div className="space-y-4 mb-6">
      {/* Solde & niveau */}
      <div className={`bg-gradient-to-r ${LEVEL_COLORS[client.level] || LEVEL_COLORS.Silver} rounded-2xl p-5 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm opacity-80">Bonjour,</p>
            <p className="text-xl font-bold">{client.name}</p>
          </div>
          <span className="text-3xl">{LEVEL_ICONS[client.level] || '🥈'}</span>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-extrabold">{client.points.toLocaleString()}</span>
          <span className="text-lg opacity-80 mb-1">pts</span>
        </div>
        {levelInfo.next && (
          <div>
            <div className="flex justify-between text-xs opacity-80 mb-1">
              <span>{client.level}</span>
              <span>{levelInfo.next} dans {levelInfo.pointsToNext.toLocaleString()} pts</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-700"
                style={{ width: `${levelInfo.progressToNext}%` }}
              />
            </div>
          </div>
        )}
        {!levelInfo.next && (
          <p className="text-sm opacity-90 font-medium">🏆 Niveau maximum atteint !</p>
        )}
      </div>

      {/* Récompenses disponibles */}
      {available.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">Récompenses disponibles ({available.length})</h3>
          </div>
          <div className="space-y-2">
            {available.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow-sm">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{reward.title}</p>
                  {reward.description && <p className="text-xs text-gray-500">{reward.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-green-600">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs font-bold">{reward.pointsRequired.toLocaleString()} pts</span>
                  </div>
                  <button
                    onClick={() => onRedeemReward(reward)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:shadow-md transition-all active:scale-95"
                  >
                    Utiliser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Récompenses verrouillées */}
      {locked.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-600 text-sm">Prochaines récompenses</h3>
          </div>
          <div className="space-y-2">
            {locked.slice(0, 3).map((reward) => {
              const missing = reward.pointsRequired - client.points;
              return (
                <div key={reward.id} className="flex items-center justify-between opacity-60">
                  <p className="text-sm text-gray-700">{reward.title}</p>
                  <span className="text-xs text-gray-500">encore {missing.toLocaleString()} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const ScanLandingPage: React.FC = () => {
  const { token } = useParams<{ token: string; enterpriseSlug?: string; cardType?: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Client résolu (depuis la carte ou depuis l'identification manuelle)
  const [resolvedClient, setResolvedClient] = useState<ClientInfo | null>(null);
  const [resolvedRewards, setResolvedRewards] = useState<Reward[]>([]);

  // Formulaire d'identification manuelle
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clientIdentified, setClientIdentified] = useState(false);

  // Service & modal
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cardCodeInput, setCardCodeInput] = useState('');

  // Redemption
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCardCode, setRedeemCardCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);

  // ── Chargement initial ───────────────────────────────────────────────────

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
          setResolvedRewards(data.data.rewards || []);

          // Si le client est déjà assigné à la carte → identification automatique
          if (data.data.client) {
            setResolvedClient(data.data.client);
            setClientIdentified(true);
          }
        } else {
          setError(data.message || 'Carte introuvable');
        }
      })
      .catch(() => setError('Erreur de connexion'))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Identification manuelle (fallback) ────────────────────────────────────

  const handleIdentifyClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) {
      setError('Veuillez fournir un téléphone ou un email');
      return;
    }

    setIdentifying(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/scan/identify-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanToken: token, phone: phone || undefined, email: email || undefined }),
      });
      const data = await res.json();

      if (data.success) {
        setResolvedRewards(data.data.rewards || []);
        if (data.data.found) {
          setResolvedClient(data.data.client);
        } else {
          setResolvedClient(null);
        }
        setClientIdentified(true);
      } else {
        setError(data.message || 'Erreur d\'identification');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setIdentifying(false);
    }
  };

  // ── Sélection service ─────────────────────────────────────────────────────

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setShowModal(true);
    setCardCodeInput('');
    setError(null);
  };

  // ── Ouverture modal récompense ────────────────────────────────────────────

  const handleOpenRedeemModal = (reward: Reward) => {
    setSelectedReward(reward);
    setRedeemCardCode('');
    setShowRedeemModal(true);
    setError(null);
  };

  // ── Validation du scan ────────────────────────────────────────────────────

  const handleValidateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCodeInput) { setError('Veuillez saisir le code de la carte'); return; }
    if (!selectedService) { setError('Service non sélectionné'); return; }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/scan/validate-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation utilisation récompense ──────────────────────────────────

  const handleConfirmRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCardCode) { setError('Veuillez saisir le code de la carte'); return; }
    if (!selectedReward) { setError('Récompense non sélectionnée'); return; }
    if (!resolvedClient) { setError('Client non identifié'); return; }

    setRedeeming(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/scan/redeem-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanToken: token,
          cardCode: redeemCardCode.trim().toUpperCase(),
          rewardId: selectedReward.id,
          clientId: resolvedClient.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour le client et les récompenses en local
        const updatedClient: ClientInfo = {
          ...resolvedClient,
          points: data.data.client.points,
          level: data.data.client.level,
          levelInfo: data.data.client.levelInfo,
          availableRewards: data.data.availableRewards,
        };
        setResolvedClient(updatedClient);
        setResolvedRewards(data.data.rewards);
        setRedeemResult(data.data);
        setShowRedeemModal(false);
      } else {
        setError(data.message || 'Erreur lors de l\'utilisation de la récompense');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setRedeeming(false);
    }
  };

  // ── États de rendu ────────────────────────────────────────────────────────

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

  if (error && !cardInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oups !</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // ── Résultat après redemption / scan réussi ──────────────────────────────

  if (redeemResult && !scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Gift className="w-12 h-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Récompense utilisée !</h2>
          <p className="text-gray-500 text-sm mb-5">{redeemResult.reward.title}</p>

          <div className={`bg-gradient-to-r ${LEVEL_COLORS[redeemResult.client.level] || LEVEL_COLORS.Silver} rounded-2xl p-4 mb-5 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm opacity-80">Nouveau solde</p>
                <p className="text-4xl font-extrabold">{redeemResult.client.points.toLocaleString()} pts</p>
              </div>
              <div className="text-right">
                <span className="text-2xl">{LEVEL_ICONS[redeemResult.client.level] || '🥈'}</span>
                <p className="text-sm font-semibold">{redeemResult.client.level}</p>
              </div>
            </div>
            <p className="text-sm opacity-80">— {redeemResult.pointsUsed.toLocaleString()} pts utilisés</p>
          </div>

          <button
            onClick={() => setRedeemResult(null)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (scanResult) {
    const ScanIcon = scanResult.service.icon ? icons[scanResult.service.icon] : null;
    const available = scanResult.rewards.filter((r) => scanResult.availableRewards.includes(r.id));
    const locked = scanResult.rewards.filter((r) => !scanResult.availableRewards.includes(r.id));

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Bravo !</h2>
          </div>

          {/* Points gagnés */}
          <div className="flex justify-center mb-5">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {ScanIcon && <ScanIcon className="w-6 h-6" />}
                <p className="font-medium">{scanResult.service.name}</p>
              </div>
              <p className="text-5xl font-bold">+{scanResult.pointsAdded}</p>
              <p className="text-sm opacity-90">points</p>
            </div>
          </div>

          {/* Nouveau solde + niveau */}
          <div className={`bg-gradient-to-r ${LEVEL_COLORS[scanResult.level] || LEVEL_COLORS.Silver} rounded-2xl p-4 mb-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm opacity-80">{scanResult.client.name}</p>
                <p className="text-3xl font-extrabold">{scanResult.totalPoints.toLocaleString()} pts</p>
              </div>
              <div className="text-right">
                <span className="text-2xl">{LEVEL_ICONS[scanResult.level] || '🥈'}</span>
                <p className="text-sm font-semibold">{scanResult.level}</p>
              </div>
            </div>
            {scanResult.levelInfo.next && (
              <div>
                <div className="flex justify-between text-xs opacity-80 mb-1">
                  <span>{scanResult.level}</span>
                  <span>{scanResult.levelInfo.next} dans {scanResult.levelInfo.pointsToNext.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${scanResult.levelInfo.progressToNext}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Récompenses disponibles */}
          {available.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-green-600" />
                <p className="font-bold text-green-800 text-sm">Récompenses disponibles ({available.length})</p>
              </div>
              <div className="space-y-1">
                {available.map((r) => (
                  <div key={r.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-800">{r.title}</span>
                    <span className="text-xs text-green-600 font-bold">{r.pointsRequired.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prochaines récompenses */}
          {locked.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Prochaines récompenses
              </p>
              {locked.slice(0, 2).map((r) => (
                <div key={r.id} className="flex justify-between items-center opacity-60 py-1">
                  <span className="text-xs text-gray-700">{r.title}</span>
                  <span className="text-xs text-gray-500">encore {(r.pointsRequired - scanResult.totalPoints).toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-4">
            Merci {scanResult.client.name} ! Continuez à accumuler des points.
          </p>
        </div>
      </div>
    );
  }

  // ── Page principale ───────────────────────────────────────────────────────

  const SelectedIcon = selectedService?.icon ? icons[selectedService.icon] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">

        {/* Header entreprise */}
        <div
          className="relative h-44 flex flex-col items-center justify-center text-white p-6"
          style={{ background: 'linear-gradient(135deg, #6A35FF 0%, #9B59B6 100%)' }}
        >
          {cardInfo?.enterprise.logo ? (
            <img
              src={cardInfo.enterprise.logo}
              alt={cardInfo.enterprise.name}
              className="w-20 h-20 rounded-full bg-white p-2 mb-3 shadow-lg object-contain"
            />
          ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <span className="text-4xl font-bold">{cardInfo?.enterprise.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl font-bold text-center">{cardInfo?.enterprise.name}</h1>
          {cardInfo?.enterprise.location && (
            <p className="text-xs opacity-80 mt-1">{cardInfo.enterprise.location}</p>
          )}
        </div>

        {/* Contenu */}
        <div className="p-5">

          {/* ─── Étape 1 : identification manuelle (carte non assignée) ─── */}
          {!clientIdentified && (
            <form onSubmit={handleIdentifyClient} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Qui êtes-vous ?</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" /> Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+229 97 00 00 00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="text-center text-sm text-gray-400">ou</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" /> Email
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" /> Nom (optionnel)
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={identifying}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {identifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChevronRight className="w-5 h-5" /> Continuer</>}
              </button>
            </form>
          )}

          {/* ─── Étape 2 : client identifié ─── */}
          {clientIdentified && (
            <>
              {/* Solde + récompenses */}
              {resolvedClient ? (
                <ClientBalanceCard
                  client={resolvedClient}
                  rewards={resolvedRewards}
                  onRedeemReward={handleOpenRedeemModal}
                />
              ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-center gap-2 text-blue-700">
                    <Star className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Nouveau client — vous gagnerez des points à chaque visite !</span>
                </div>
              )}

              {/* Liste des services */}
              <h2 className="text-base font-bold text-gray-800 mb-3">Sélectionner un service</h2>
              {cardInfo?.services && cardInfo.services.length > 0 ? (
                <div className="space-y-3">
                  {cardInfo.services.map((service) => {
                    const ServiceIcon = service.icon ? icons[service.icon] : null;
                    return (
                      <button
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl p-4 transition-all border-2 border-transparent hover:border-purple-300 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {ServiceIcon && <ServiceIcon className="w-7 h-7 text-purple-600" />}
                            <div>
                              <p className="font-bold text-gray-800">{service.name}</p>
                              {service.description && <p className="text-xs text-gray-500">{service.description}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">+{service.pointsToAdd}</p>
                            <p className="text-xs text-gray-400">pts</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Aucun service disponible</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Modal confirmation scan (service) ─── */}
      {showModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Confirmer le service</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                {SelectedIcon && <SelectedIcon className="w-7 h-7 text-purple-600" />}
                <div>
                  <p className="font-bold text-gray-800">{selectedService.name}</p>
                  <p className="text-sm text-purple-600 font-semibold">+{selectedService.pointsToAdd} points</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Client : <strong>{resolvedClient?.name || name || phone || email}</strong>
            </p>

            <form onSubmit={handleValidateScan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🔑 Code de la carte physique</label>
                <input
                  type="text"
                  value={cardCodeInput}
                  onChange={(e) => setCardCodeInput(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-lg tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">⚠️ Vérifiez le code sur la carte présentée</p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '✓ Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal utilisation récompense ─── */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Utiliser la récompense</h3>
              <button
                onClick={() => { setShowRedeemModal(false); setError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Détail récompense */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{selectedReward.title}</p>
                  {selectedReward.description && (
                    <p className="text-xs text-gray-500">{selectedReward.description}</p>
                  )}
                  <p className="text-sm text-red-500 font-semibold mt-1">
                    — {selectedReward.pointsRequired.toLocaleString()} pts
                  </p>
                </div>
              </div>
            </div>

            {/* Solde après déduction (aperçu) */}
            {resolvedClient && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex justify-between items-center text-sm">
                <span className="text-gray-500">Solde après utilisation</span>
                <span className="font-bold text-gray-800">
                  {(resolvedClient.points - selectedReward.pointsRequired).toLocaleString()} pts
                </span>
              </div>
            )}

            <form onSubmit={handleConfirmRedeem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔑 Code de la carte physique
                </label>
                <input
                  type="text"
                  value={redeemCardCode}
                  onChange={(e) => setRedeemCardCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">⚠️ Vérifiez le code sur la carte présentée</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRedeemModal(false); setError(null); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {redeeming
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><Gift className="w-4 h-4" /> Confirmer</>
                  }
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
