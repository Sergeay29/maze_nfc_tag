import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Star,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StatCard, ChartCard, Card, Badge, Button, Input, Toast } from '../../components';
import { useAuth } from '../../auth/useAuth';
import { changePassword } from '../../api/authApi';
import { getEnterpriseDashboard, type EnterpriseDashboardData } from '../../api/enterpriseApi';

const EnterpriseDashboard: React.FC = () => {
  const { user, token, refreshUser } = useAuth();

  const [data, setData] = useState<EnterpriseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    getEnterpriseDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await changePassword(token!, newPassword);
      await refreshUser();
      setSuccessToast(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {successToast && (
        <Toast
          message="Mot de passe mis à jour avec succès !"
          variant="success"
          onClose={() => setSuccessToast(false)}
        />
      )}

      {/* Modale bloquante changement de mot de passe */}
      {user?.mustChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-card animate-fade-in">
            <div className="p-6 border-b border-slate/10">
              <h2 className="text-xl font-bold font-poppins text-dark">Changement de mot de passe requis</h2>
              <p className="text-sm text-slate mt-1">Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.</p>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
              <div className="relative">
                <Input
                  label="Nouveau mot de passe"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  rightIcon={
                    <button type="button" onClick={() => setShowNew(v => !v)} className="text-slate hover:text-dark">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              <div className="relative">
                <Input
                  label="Confirmer le mot de passe"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répéter le mot de passe"
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-slate hover:text-dark">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              <Button type="submit" fullWidth disabled={saving}>
                {saving ? 'Enregistrement...' : 'Confirmer le nouveau mot de passe'}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold font-poppins text-dark">
          Bonjour, {user?.enterprise?.name ?? ''} !
        </h1>
        <p className="text-slate mt-1">Voici le résumé de votre activité</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate animate-pulse">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Clients" value={String(data?.stats.totalClients ?? 0)} icon={<Users className="w-5 h-5" />} gradient />
            <StatCard title="Cartes actives" value={String(data?.stats.activeCards ?? 0)} icon={<CreditCard className="w-5 h-5" />} />
            <StatCard title="Points émis" value={(data?.stats.totalPointsGiven ?? 0).toLocaleString('fr-FR')} icon={<Star className="w-5 h-5" />} />
            <StatCard title="Scans" value={String(data?.stats.totalScans ?? 0)} icon={<TrendingUp className="w-5 h-5" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard
                title="Scans sur 7 jours"
                data={data?.scanStats ?? []}
                type="line"
                dataKey="scans"
                xAxisKey="day"
              />
            </div>
            <Card>
              <h3 className="text-lg font-semibold font-poppins text-dark mb-6">Top clients</h3>
              <div className="space-y-3">
                {(data?.topClients ?? []).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-cloud transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center text-white text-sm font-medium">#{index + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-dark">{client.name}</p>
                        <p className="text-xs text-slate">{client.points} pts</p>
                      </div>
                    </div>
                    <Badge variant={client.level === 'Platinum' ? 'platinum' : client.level === 'Gold' ? 'gold' : 'silver'}>
                      {client.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-poppins text-dark">Derniers scans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cloud">
                  <tr>
                    <th className="table-header px-4 py-3">Client</th>
                    <th className="table-header px-4 py-3 hidden sm:table-cell">Carte</th>
                    <th className="table-header px-4 py-3">Action</th>
                    <th className="table-header px-4 py-3"><Clock className="w-4 h-4" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate/10">
                  {(data?.recentScans ?? []).map((scan) => (
                    <tr key={scan.id} className="hover:bg-cloud transition-colors duration-200">
                      <td className="table-cell px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center text-white text-xs">
                            {(scan.Client?.name ?? '?').charAt(0)}
                          </div>
                          <span className="font-medium">{scan.Client?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="table-cell px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-sm text-slate">{scan.NFCCard?.cardCode ?? '—'}</span>
                      </td>
                      <td className="table-cell px-4 py-3">
                        <Badge variant={scan.pointsAdded > 0 ? 'success' : scan.pointsAdded < 0 ? 'error' : 'primary'}>
                          {scan.pointsAdded > 0 ? `+${scan.pointsAdded} pts` : scan.pointsAdded < 0 ? `${scan.pointsAdded} pts` : 'Consultation'}
                        </Badge>
                      </td>
                      <td className="table-cell px-4 py-3 text-slate text-sm">
                        {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default EnterpriseDashboard;