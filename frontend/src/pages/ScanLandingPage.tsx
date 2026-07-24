import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2, Phone, Mail, User, X, Gift,
  ChevronRight, Lock, Trophy, Star, CheckCircle2,
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
  card: { id: string; cardCode: string; cardNumber: string; type: string; isAssigned: boolean };
  enterprise: { id: string; name: string; logo: string | null; location: string | null };
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
  reward: { id: string; title: string; description?: string };
  client: { id: string; name: string; points: number; level: string; levelInfo: LevelInfo };
  rewards: Reward[];
  availableRewards: string[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LEVEL_COLORS: Record<string, string> = {
  Silver: 'from-slate-400 to-slate-500',
  Gold: 'from-yellow-400 to-orange-400',
  Platinum: 'from-purple-500 to-indigo-500',
};

const LEVEL_ICONS: Record<string, string> = {
  Silver: '🥈', Gold: '🥇', Platinum: '💎',
};

// ─── Helper : carte solde ─────────────────────────────────────────────────────

const BalanceHeader: React.FC<{ client: ClientInfo }> = ({ client }) => {
  const { levelInfo } = client;
  return (
    <div className={`bg-gradient-to-br ${LEVEL_COLORS[client.level] || LEVEL_COLORS.Silver} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs opacity-70 uppercase tracking-wide">Bonjour</p>
          <p className="text-lg font-bold leading-tight">{client.name}</p>
        </div>
        <span className="text-4xl">{LEVEL_ICONS[client.level] || '🥈'}</span>
      </div>
      <div className="flex items-end gap-1 mb-4">
        <span className="text-5xl font-black tabular-nums">{client.points.toLocaleString()}</span>
        <span className="text-base opacity-70 mb-1">pts</span>
      </div>
      {levelInfo.next ? (
        <>
          <div className="flex justify-between text-xs opacity-75 mb-1">
            <span>{client.level}</span>
            <span>{levelInfo.next} — encore {levelInfo.pointsToNext.toLocaleString()} pts</span>
          </div>
          <div className="w-full bg-white/25 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-700"
              style={{ width: `${levelInfo.progressToNext}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-xs opacity-80 font-semibold">🏆 Niveau maximum atteint !</p>
      )}
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const ScanLandingPage: React.FC = () => {
  const { token } = useParams<{ token: string; enterpriseSlug?: string; cardType?: string }>();

  // Données
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [resolvedClient, setResolvedClient] = useState<ClientInfo | null>(null);
  const [resolvedRewards, setResolvedRewards] = useState<Reward[]>([]);

  // Étapes : 'welcome' | 'identify' | 'services'
  const [step, setStep] = useState<'welcome' | 'identify' | 'services'>('welcome');

  // Formulaire identification
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [identifying, setIdentifying] = useState(false);

  // Modal service
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceCardCode, setServiceCardCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Modal récompense
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCardCode, setRedeemCardCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);

  // ── Chargement initial ───────────────────────────────────────────────────

  useEffect(() => {
    if (!token) { setError('Lien invalide'); setLoading(false); return; }

    fetch(`${API_URL}/scan/card/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCardInfo(data.data);
          setResolvedRewards(data.data.rewards || []);
          if (data.data.client) {
            setResolvedClient(data.data.client);
            setStep('welcome');        // carte assignée → on montre directement le solde
          } else {
            setStep('identify');       // pas de client assigné → identification
          }
        } else {
          setError(data.message || 'Carte introuvable');
        }
      })
      .catch(() => setError('Erreur de connexion'))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Identification manuelle ───────────────────────────────────────────────

  const handleIdentifyClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) { setError('Téléphone ou email requis'); return; }
    setIdentifying(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/scan/identify-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanToken: token, phone: phone || undefined, email: email || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResolvedRewards(data.data.rewards || []);
        setResolvedClient(data.data.found ? data.data.client : null);
        setStep('welcome');
      } else {
        setError(data.message || 'Erreur d\'identification');
      }
    } catch { setError('Erreur de connexion'); }
    finally { setIdentifying(false); }
  };

  // ── Validation scan service ───────────────────────────────────────────────

  const handleValidateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceCardCode) { setModalError('Veuillez saisir le code de la carte'); return; }
    if (!selectedService) { setModalError('Service non sélectionné'); return; }
    setSubmitting(true); setModalError(null);
    try {
      const res = await fetch(`${API_URL}/scan/validate-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanToken: token,
          cardCode: serviceCardCode.trim().toUpperCase(),
          serviceId: selectedService.id,
          phone: phone || undefined,
          email: email || undefined,
          name: name || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.data);
        setShowServiceModal(false);
      } else {
        setModalError(data.message || 'Erreur lors du scan');
      }
    } catch { setModalError('Erreur de connexion'); }
    finally { setSubmitting(false); }
  };

  // ── Utilisation récompense ────────────────────────────────────────────────

  const handleConfirmRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCardCode) { setModalError('Veuillez saisir le code de la carte'); return; }
    if (!selectedReward) { setModalError('Récompense non sélectionnée'); return; }
    if (!resolvedClient) { setModalError('Client non identifié'); return; }
    setRedeeming(true); setModalError(null);
    try {
      const res = await fetch(`${API_URL}/scan/redeem-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanToken: token,
          cardCode: redeemCardCode.trim().toUpperCase(),
          rewardId: selectedReward.id,
          clientId: resolvedClient.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Mettre à jour le solde en local immédiatement
        setResolvedClient({
          ...resolvedClient,
          points: data.data.client.points,
          level: data.data.client.level,
          levelInfo: data.data.client.levelInfo,
          availableRewards: data.data.availableRewards,
        });
        setResolvedRewards(data.data.rewards);
        setRedeemResult(data.data);
        setShowRedeemModal(false);
      } else {
        setModalError(data.message || 'Erreur lors de l\'utilisation');
      }
    } catch { setModalError('Erreur de connexion'); }
    finally { setRedeeming(false); }
  };

  // ── Helpers UI ────────────────────────────────────────────────────────────

  const openServiceModal = (s: Service) => {
    setSelectedService(s);
    setServiceCardCode('');
    setModalError(null);
    setShowServiceModal(true);
  };

  const openRedeemModal = (r: Reward) => {
    setSelectedReward(r);
    setRedeemCardCode('');
    setModalError(null);
    setShowRedeemModal(true);
  };

  const EnterpriseHeader = () => (
    <div
      className="flex flex-col items-center justify-center text-white py-8 px-6"
      style={{ background: 'linear-gradient(135deg,#6A35FF 0%,#9B59B6 100%)' }}
    >
      {cardInfo?.enterprise.logo ? (
        <img
          src={cardInfo.enterprise.logo}
          alt={cardInfo.enterprise.name}
          className="w-20 h-20 rounded-full bg-white p-1.5 mb-3 shadow-lg object-contain"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <span className="text-4xl font-bold">{cardInfo?.enterprise.name.charAt(0)}</span>
        </div>
      )}
      <h1 className="text-xl font-bold">{cardInfo?.enterprise.name}</h1>
      {cardInfo?.enterprise.location && (
        <p className="text-xs opacity-75 mt-0.5">{cardInfo.enterprise.location}</p>
      )}
    </div>
  );

  // ── Rendu états globaux ───────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
    </div>
  );

  if (error && !cardInfo) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <span className="text-5xl">❌</span>
        <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">Lien invalide</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  // ── Résultat scan service ─────────────────────────────────────────────────

  if (scanResult) {
    const available = scanResult.rewards.filter((r) => scanResult.availableRewards.includes(r.id));
    const locked = scanResult.rewards.filter((r) => !scanResult.availableRewards.includes(r.id));
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <EnterpriseHeader />
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-800">Bravo !</h2>
            </div>

            {/* Badge points gagnés */}
            {/* <div className="flex justify-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {ScanIcon && <ScanIcon className="w-5 h-5" />}
                  <span className="text-sm font-medium opacity-90">{scanResult.service.name}</span>
                </div>
                <p className="text-5xl font-black">+{scanResult.pointsAdded}</p>
                <p className="text-xs opacity-80 mt-0.5">points</p>
              </div>
            </div> */}

            {/* Nouveau solde */}
            <BalanceHeader client={{
              ...scanResult.client,
              levelInfo: scanResult.levelInfo,
              availableRewards: scanResult.availableRewards,
            }} />

            {/* Récompenses dispo */}
            {available.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-bold text-green-800 flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4" /> Récompenses disponibles ({available.length})
                </p>
                <div className="space-y-1.5">
                  {available.map((r) => (
                    <div key={r.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">{r.title}</span>
                      <span className="text-xs font-bold text-green-600">{r.pointsRequired.toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prochaines récompenses */}
            {locked.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Prochaines récompenses
                </p>
                {locked.slice(0, 2).map((r) => (
                  <div key={r.id} className="flex justify-between opacity-50 py-0.5">
                    <span className="text-xs text-gray-700">{r.title}</span>
                    <span className="text-xs text-gray-500">encore {(r.pointsRequired - scanResult.totalPoints).toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-gray-400 text-xs">
              Merci {scanResult.client.name} ! Continuez à accumuler des points.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ÉTAPE : Identification manuelle ───────────────────────────────────────

  if (step === 'identify') return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <EnterpriseHeader />
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Qui êtes-vous ?</h2>
          <form onSubmit={handleIdentifyClient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />Téléphone
              </label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 97 00 00 00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <p className="text-center text-xs text-gray-400">ou</p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />Email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                <User className="w-4 h-4 inline mr-1" />Nom (optionnel)
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <button
              type="submit" disabled={identifying}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-base hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {identifying
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><ChevronRight className="w-5 h-5" />Continuer</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // ── ÉTAPE : Accueil (solde + récompenses + bouton Continuer) ─────────────

  if (step === 'welcome') {
    const availableRewards = resolvedRewards.filter((r) =>
      resolvedClient ? resolvedClient.availableRewards.includes(r.id) : false
    );
    const lockedRewards = resolvedRewards.filter((r) =>
      resolvedClient ? !resolvedClient.availableRewards.includes(r.id) : true
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <EnterpriseHeader />

          <div className="p-5 space-y-4">

            {/* Solde ou message nouveau client */}
            {resolvedClient ? (
              <BalanceHeader client={resolvedClient} />
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-blue-700">
                <Star className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">Bienvenue !</p>
                  <p className="text-xs opacity-80">Vous gagnerez des points à chaque visite.</p>
                </div>
              </div>
            )}

            {/* Récompenses disponibles avec bouton Utiliser */}
            {availableRewards.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-green-800 flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4" />
                  Récompenses disponibles ({availableRewards.length})
                </p>
                <div className="space-y-2">
                  {availableRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="bg-white rounded-xl px-3 py-3 shadow-sm flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 text-sm truncate">{reward.title}</p>
                        {reward.description && (
                          <p className="text-xs text-gray-400 truncate">{reward.description}</p>
                        )}
                        <p className="text-xs font-bold text-green-600 mt-0.5 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {reward.pointsRequired.toLocaleString()} pts
                        </p>
                      </div>
                      <button
                        onClick={() => openRedeemModal(reward)}
                        className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:shadow-md transition active:scale-95 whitespace-nowrap"
                      >
                        Utiliser
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Récompenses verrouillées */}
            {lockedRewards.length > 0 && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
                  <Lock className="w-3 h-3" /> Prochaines récompenses
                </p>
                <div className="space-y-1.5">
                  {lockedRewards.slice(0, 4).map((reward) => {
                    const missing = resolvedClient
                      ? reward.pointsRequired - resolvedClient.points
                      : reward.pointsRequired;
                    return (
                      <div key={reward.id} className="flex items-center justify-between opacity-55">
                        <p className="text-xs text-gray-700">{reward.title}</p>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          encore {missing.toLocaleString()} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aucune récompense configurée */}
            {resolvedRewards.length === 0 && (
              <div className="text-center py-2 text-gray-400 text-xs">
                Aucune récompense configurée pour le moment.
              </div>
            )}

            {/* Bouton Continuer → services */}
            <button
              onClick={() => setStep('services')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-base hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <ChevronRight className="w-5 h-5" />
              Continuer — Gagner des points
            </button>
          </div>
        </div>

        {/* ─── Modal utilisation récompense ─── */}
        {showRedeemModal && selectedReward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800">Utiliser la récompense</h3>
                <button onClick={() => { setShowRedeemModal(false); setModalError(null); }}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              {/* Détail récompense */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{selectedReward.title}</p>
                  {selectedReward.description && (
                    <p className="text-xs text-gray-500">{selectedReward.description}</p>
                  )}
                  <p className="text-xs font-bold text-red-500 mt-1">
                    − {selectedReward.pointsRequired.toLocaleString()} pts
                  </p>
                </div>
              </div>

              {/* Aperçu solde après */}
              {resolvedClient && (
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Solde après utilisation</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {(resolvedClient.points - selectedReward.pointsRequired).toLocaleString()} pts
                  </span>
                </div>
              )}

              <form onSubmit={handleConfirmRedeem} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    🔑 Code de la carte physique
                  </label>
                  <input
                    type="text"
                    value={redeemCardCode}
                    onChange={(e) => setRedeemCardCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    autoFocus
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg tracking-widest"
                  />
                  <p className="text-xs text-gray-400 mt-1">⚠️ Vérifiez le code sur la carte présentée</p>
                </div>
                {modalError && (
                  <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-xl">{modalError}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowRedeemModal(false); setModalError(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={redeeming}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {redeeming
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Gift className="w-4 h-4" />Confirmer</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Résultat redemption (toast / overlay) ─── */}
        {redeemResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <Gift className="w-9 h-9 text-purple-600" />
              </div>
              <h3 className="text-xl font-black text-gray-800">Récompense utilisée !</h3>
              <p className="text-gray-500 text-sm mt-1 mb-4">{redeemResult.reward.title}</p>

              <div className={`bg-gradient-to-br ${LEVEL_COLORS[redeemResult.client.level] || LEVEL_COLORS.Silver} rounded-2xl p-4 text-white mb-4`}>
                <p className="text-xs opacity-70 mb-0.5">Nouveau solde</p>
                <p className="text-4xl font-black">{redeemResult.client.points.toLocaleString()} pts</p>
                <p className="text-xs opacity-75 mt-1">− {redeemResult.pointsUsed.toLocaleString()} pts utilisés</p>
              </div>

              <button
                onClick={() => setRedeemResult(null)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition"
              >
                OK — Retour
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ÉTAPE : Services (grille de cards) ────────────────────────────────────

  const SelectedServiceIcon = selectedService?.icon ? icons[selectedService.icon] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <EnterpriseHeader />

        <div className="p-5">

          {/* Résumé solde compact */}
          {resolvedClient && (
            <div className={`bg-gradient-to-r ${LEVEL_COLORS[resolvedClient.level] || LEVEL_COLORS.Silver} rounded-xl px-4 py-3 text-white flex items-center justify-between mb-5`}>
              <div>
                <p className="text-xs opacity-70">{resolvedClient.name}</p>
                <p className="text-2xl font-black">{resolvedClient.points.toLocaleString()} pts</p>
              </div>
              <div className="text-right">
                <span className="text-2xl">{LEVEL_ICONS[resolvedClient.level] || '🥈'}</span>
                <p className="text-xs font-semibold opacity-90">{resolvedClient.level}</p>
              </div>
            </div>
          )}

          {/* Bouton retour */}
          <button
            onClick={() => setStep('welcome')}
            className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1 mb-3 transition"
          >
            ← Retour
          </button>

          <h2 className="text-base font-bold text-gray-800 mb-4">Quel service utilisez-vous ?</h2>

          {/* Grille de services */}
          {cardInfo?.services && cardInfo.services.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {cardInfo.services.map((service) => {
                const ServiceIcon = service.icon ? icons[service.icon] : null;
                return (
                  <button
                    key={service.id}
                    onClick={() => openServiceModal(service)}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-transparent hover:border-purple-300 rounded-2xl p-4 transition-all active:scale-95 text-left flex flex-col items-center gap-2"
                  >
                    {/* Icône */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: service.color + '20' }}
                    >
                      {ServiceIcon
                        ? <ServiceIcon className="w-6 h-6 text-white " style={{ color: service.color }} />
                        : <span className="text-white text-lg font-bold">{service.name.charAt(0)}</span>
                      }
                    </div>
                    {/* Nom */}
                    <p className="font-bold text-gray-800 text-sm text-center leading-tight">{service.name}</p>
                    {/* Points */}
                    <p className="text-xl font-black text-purple-600">+{service.pointsToAdd}</p>
                    <p className="text-xs text-gray-400 -mt-2">points</p>
                    {/* Description courte */}
                    {service.description && (
                      <p className="text-xs text-gray-400 text-center leading-tight line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun service disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal confirmation service ─── */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Confirmer le service</h3>
              <button onClick={() => setShowServiceModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Service sélectionné */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: selectedService.color || '#6A35FF' }}
              >
                {SelectedServiceIcon
                  ? <SelectedServiceIcon className="w-6 h-6 text-white" />
                  : <span className="text-white font-bold">{selectedService.name.charAt(0)}</span>
                }
              </div>
              <div>
                <p className="font-bold text-gray-800">{selectedService.name}</p>
                <p className="text-lg font-black text-purple-600">+{selectedService.pointsToAdd} pts</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Client : <strong>{resolvedClient?.name || name || phone || email || 'Nouveau client'}</strong>
            </p>

            <form onSubmit={handleValidateScan} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  🔑 Code de la carte physique
                </label>
                <input
                  type="text"
                  value={serviceCardCode}
                  onChange={(e) => setServiceCardCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-lg tracking-widest"
                />
                <p className="text-xs text-gray-400 mt-1">⚠️ Vérifiez le code sur la carte présentée</p>
              </div>
              {modalError && (
                <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-xl">{modalError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Valider'}
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
